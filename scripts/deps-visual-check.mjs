#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

import {
  buildStableMockResponse,
  computeAllowedPixels,
  DEFAULT_SAMPLE_DELAY_MS,
  DEFAULT_SAMPLES,
  DEFAULT_SETTLE_MS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VIEWPORT,
  STATIC_TARGETS,
} from "./deps-visual-lib.mjs";

function printUsage() {
  console.log(`Usage:
  pnpm run deps:visual -- capture --base-url http://127.0.0.1:4321 [--output-dir /tmp/path]
  pnpm run deps:visual -- compare --before-dir /tmp/before --after-dir /tmp/after [--output-dir /tmp/report]

Options:
  --samples <n>            Number of screenshots per target. Default: ${DEFAULT_SAMPLES}
  --settle-ms <n>          Wait after each navigation. Default: ${DEFAULT_SETTLE_MS}
  --sample-delay-ms <n>    Wait between repeated samples. Default: ${DEFAULT_SAMPLE_DELAY_MS}
  --viewport-width <n>     Default: ${DEFAULT_VIEWPORT.width}
  --viewport-height <n>    Default: ${DEFAULT_VIEWPORT.height}
  --timeout-ms <n>         Default: ${DEFAULT_TIMEOUT_MS}`);
}

function parseArgs(argv) {
  const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
  const [command, ...rest] = normalizedArgv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const nextValue = inlineValue ?? rest[index + 1];

    if (inlineValue == null) {
      if (nextValue == null || nextValue.startsWith("--")) {
        options[rawKey] = true;
        continue;
      }

      options[rawKey] = nextValue;
      index += 1;
      continue;
    }

    options[rawKey] = nextValue;
  }

  return { command, options };
}

function toInt(value, fallback) {
  if (value == null) {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected integer, received: ${value}`);
  }

  return parsed;
}

function resolveOutputDir(explicitPath, prefix) {
  if (explicitPath) {
    return path.resolve(String(explicitPath));
  }

  return path.join(
    os.tmpdir(),
    `${prefix}-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`,
  );
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function joinUrl(baseUrl, relativeUrl) {
  return new URL(relativeUrl, baseUrl).toString();
}

async function installVisualRegressionMode(page) {
  await page.addInitScript(() => {
    document.documentElement.dataset.visualRegression = "true";
  });
}

async function applyVisualRegressionStyles(page) {
  await page.addStyleTag({
    content: `
      html {
        scroll-behavior: auto !important;
      }

      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function stabilizePage(page, settleMs, timeoutMs) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    if ("fonts" in document) {
      await document.fonts.ready;
    }
  });
  await page.waitForFunction(
    () => {
      const browserZone = document.getElementById("browser-tz")?.textContent?.trim();
      const helperText = document.getElementById("helper-code")?.textContent?.trim();
      const statuses = [...document.querySelectorAll("[data-status]")].map((node) =>
        node.textContent?.trim(),
      );
      return (
        browserZone === "Europe/Berlin" &&
        Boolean(helperText) &&
        statuses.length === 4 &&
        statuses.every((status) => status && status !== "loading")
      );
    },
    { timeout: timeoutMs },
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(settleMs);
}

async function installStableApiMocks(page) {
  await page.route("**/*", async (route) => {
    const mocked = buildStableMockResponse(route.request().url());

    if (mocked) {
      await route.fulfill(mocked);
      return;
    }

    await route.continue();
  });
}

async function createBrowserContext(browser, options) {
  const context = await browser.newContext({
    colorScheme: "dark",
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "Europe/Berlin",
    viewport: {
      width: toInt(options["viewport-width"], DEFAULT_VIEWPORT.width),
      height: toInt(options["viewport-height"], DEFAULT_VIEWPORT.height),
    },
  });

  const page = await context.newPage();
  await installVisualRegressionMode(page);
  await installStableApiMocks(page);

  return { context, page };
}

async function captureStaticTargets(page, baseUrl, outputDir, options, manifestTargets) {
  const samples = toInt(options.samples, DEFAULT_SAMPLES);
  const settleMs = toInt(options["settle-ms"], DEFAULT_SETTLE_MS);
  const sampleDelayMs = toInt(options["sample-delay-ms"], DEFAULT_SAMPLE_DELAY_MS);
  const timeoutMs = toInt(options["timeout-ms"], DEFAULT_TIMEOUT_MS);

  for (const target of STATIC_TARGETS) {
    const targetDir = path.join(outputDir, target.id);
    await ensureDir(targetDir);

    const files = [];

    for (let sample = 1; sample <= samples; sample += 1) {
      await page.goto(joinUrl(baseUrl, target.url), {
        timeout: timeoutMs,
        waitUntil: "networkidle",
      });
      await applyVisualRegressionStyles(page);
      await stabilizePage(page, settleMs, timeoutMs);

      const relativePath = path.join(target.id, `sample-${sample}.png`);
      await page.screenshot({
        path: path.join(outputDir, relativePath),
        animations: "disabled",
        fullPage: true,
        type: "png",
      });
      files.push(relativePath);

      if (sample < samples) {
        await page.waitForTimeout(sampleDelayMs);
      }
    }

    manifestTargets.push({
      id: target.id,
      label: target.label,
      kind: "page",
      files,
      url: target.url,
    });
  }
}

async function runCapture(options) {
  const baseUrl = options["base-url"];
  if (!baseUrl) {
    throw new Error("Missing required option: --base-url");
  }

  const outputDir = resolveOutputDir(options["output-dir"], "deps-visual-capture");
  await ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });

  try {
    const { context, page } = await createBrowserContext(browser, options);
    const manifestTargets = [];

    await captureStaticTargets(page, baseUrl, outputDir, options, manifestTargets);
    await context.close();

    const manifest = {
      baseUrl,
      capturedAt: new Date().toISOString(),
      outputDir,
      sampleCount: toInt(options.samples, DEFAULT_SAMPLES),
      targets: manifestTargets.sort((left, right) => left.id.localeCompare(right.id)),
    };

    await writeJson(path.join(outputDir, "manifest.json"), manifest);
    console.log(`Captured ${manifest.targets.length} targets into ${outputDir}`);
  } finally {
    await browser.close();
  }
}

async function readManifest(manifestDir) {
  const manifestPath = path.join(path.resolve(manifestDir), "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  return {
    ...manifest,
    rootDir: path.resolve(manifestDir),
  };
}

function buildPairs(filesA, filesB) {
  const pairs = [];

  for (const fileA of filesA) {
    for (const fileB of filesB) {
      pairs.push([fileA, fileB]);
    }
  }

  return pairs;
}

async function readPng(filePath) {
  return PNG.sync.read(await fs.readFile(filePath));
}

async function compareImagePair(fileA, fileB) {
  const imageA = await readPng(fileA);
  const imageB = await readPng(fileB);

  if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
    return {
      compatible: false,
      dimensions: {
        before: `${imageA.width}x${imageA.height}`,
        after: `${imageB.width}x${imageB.height}`,
      },
    };
  }

  const diffImage = new PNG({ width: imageA.width, height: imageA.height });
  const changedPixels = pixelmatch(
    imageA.data,
    imageB.data,
    diffImage.data,
    imageA.width,
    imageA.height,
    {
      includeAA: true,
      threshold: 0.1,
    },
  );

  return {
    compatible: true,
    changedPixels,
    totalPixels: imageA.width * imageA.height,
    diffImage,
  };
}

async function writeDiffImage(outputDir, targetId, diffImage) {
  const diffDir = path.join(outputDir, "diffs");
  await ensureDir(diffDir);
  const diffPath = path.join(diffDir, `${targetId}.png`);
  await fs.writeFile(diffPath, PNG.sync.write(diffImage));
  return diffPath;
}

async function runCompare(options) {
  const beforeDir = options["before-dir"];
  const afterDir = options["after-dir"];

  if (!beforeDir || !afterDir) {
    throw new Error("Missing required options: --before-dir and --after-dir");
  }

  const reportDir = resolveOutputDir(options["output-dir"], "deps-visual-report");
  await ensureDir(reportDir);

  const beforeManifest = await readManifest(beforeDir);
  const afterManifest = await readManifest(afterDir);
  const afterTargetsById = new Map(afterManifest.targets.map((target) => [target.id, target]));

  const results = [];

  for (const beforeTarget of beforeManifest.targets) {
    const afterTarget = afterTargetsById.get(beforeTarget.id);

    if (!afterTarget) {
      results.push({
        id: beforeTarget.id,
        label: beforeTarget.label,
        status: "failed",
        reason: "Target missing from after manifest.",
      });
      continue;
    }

    const beforeFiles = beforeTarget.files.map((file) => path.join(beforeManifest.rootDir, file));
    const afterFiles = afterTarget.files.map((file) => path.join(afterManifest.rootDir, file));
    const noiseComparisons = [];

    if (beforeFiles.length > 1) {
      const beforePairs = buildPairs(beforeFiles, beforeFiles).filter(([left, right]) => left < right);
      for (const [left, right] of beforePairs) {
        noiseComparisons.push(await compareImagePair(left, right));
      }
    }

    if (afterFiles.length > 1) {
      const afterPairs = buildPairs(afterFiles, afterFiles).filter(([left, right]) => left < right);
      for (const [left, right] of afterPairs) {
        noiseComparisons.push(await compareImagePair(left, right));
      }
    }

    const incompatibleNoise = noiseComparisons.find((comparison) => !comparison.compatible);
    if (incompatibleNoise) {
      results.push({
        id: beforeTarget.id,
        label: beforeTarget.label,
        status: "failed",
        reason: "Incompatible dimensions inside calibration samples.",
        dimensions: incompatibleNoise.dimensions,
      });
      continue;
    }

    const crossPairs = buildPairs(beforeFiles, afterFiles);
    let bestMatch = null;

    for (const [left, right] of crossPairs) {
      const comparison = await compareImagePair(left, right);

      if (!comparison.compatible) {
        bestMatch = {
          status: "failed",
          reason: "Screenshot dimensions changed.",
          dimensions: comparison.dimensions,
        };
        break;
      }

      if (
        bestMatch == null ||
        bestMatch.status === "failed" ||
        comparison.changedPixels < bestMatch.changedPixels
      ) {
        bestMatch = {
          status: "ok",
          changedPixels: comparison.changedPixels,
          totalPixels: comparison.totalPixels,
          diffImage: comparison.diffImage,
        };
      }
    }

    if (!bestMatch || bestMatch.status === "failed") {
      results.push({
        id: beforeTarget.id,
        label: beforeTarget.label,
        status: "failed",
        reason: bestMatch?.reason ?? "No comparable screenshots found.",
        dimensions: bestMatch?.dimensions,
      });
      continue;
    }

    const noisePixels = noiseComparisons.reduce(
      (maximum, comparison) => Math.max(maximum, comparison.changedPixels),
      0,
    );
    const allowedPixels = computeAllowedPixels({
      totalPixels: bestMatch.totalPixels,
      noisePixels,
    });
    const changedRatio = bestMatch.changedPixels / bestMatch.totalPixels;
    const allowedRatio = allowedPixels / bestMatch.totalPixels;
    const passed = bestMatch.changedPixels <= allowedPixels;
    const diffImagePath = await writeDiffImage(reportDir, beforeTarget.id, bestMatch.diffImage);

    results.push({
      id: beforeTarget.id,
      label: beforeTarget.label,
      status: passed ? "passed" : "failed",
      changedPixels: bestMatch.changedPixels,
      allowedPixels,
      noisePixels,
      changedRatio,
      allowedRatio,
      diffImagePath,
    });
  }

  const failedTargets = results.filter((result) => result.status === "failed");
  const summary = {
    comparedAt: new Date().toISOString(),
    beforeDir: path.resolve(beforeDir),
    afterDir: path.resolve(afterDir),
    reportDir,
    passed: failedTargets.length === 0,
    targetCount: results.length,
    failedTargets: failedTargets.map((target) => target.id),
    results,
  };

  await writeJson(path.join(reportDir, "report.json"), summary);

  for (const result of results) {
    if (result.status === "passed") {
      console.log(
        `PASS ${result.id}: changed=${result.changedPixels} allowed=${result.allowedPixels} noise=${result.noisePixels}`,
      );
      continue;
    }

    console.log(`FAIL ${result.id}: ${result.reason ?? `changed=${result.changedPixels}`}`);
  }

  console.log(`Report written to ${reportDir}`);

  if (!summary.passed) {
    process.exitCode = 1;
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (!command || options.help) {
    printUsage();
    return;
  }

  if (command === "capture") {
    await runCapture(options);
    return;
  }

  if (command === "compare") {
    await runCompare(options);
    return;
  }

  throw new Error(`Unsupported command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

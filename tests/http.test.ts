import { describe, expect, it } from "vitest";
import { setHeaderSafely } from "../src/lib/http";

describe("setHeaderSafely", () => {
  it("sets header directly when response headers are mutable", () => {
    const response = new Response("ok");

    const next = setHeaderSafely(response, "x-content-type-options", "nosniff");

    expect(next).toBe(response);
    expect(next.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("clones response when headers are immutable", () => {
    const response = new Response("ok", { status: 200, headers: { "cache-control": "max-age=10" } });
    const originalSet = response.headers.set.bind(response.headers);
    response.headers.set = () => {
      throw new TypeError("Can't modify immutable headers.");
    };

    const next = setHeaderSafely(response, "x-content-type-options", "nosniff");

    expect(next).not.toBe(response);
    expect(next.headers.get("x-content-type-options")).toBe("nosniff");
    expect(next.headers.get("cache-control")).toBe("max-age=10");

    response.headers.set = originalSet;
  });
});

function convertNullableTypes(value) {
  if (Array.isArray(value)) {
    return value.map(convertNullableTypes);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const next = Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, convertNullableTypes(nested)]),
  );

  if (
    Array.isArray(next.type) &&
    next.type.length === 2 &&
    next.type.includes("null") &&
    next.type.some((entry) => entry !== "null")
  ) {
    next.type = next.type.find((entry) => entry !== "null");
    next.nullable = true;
  }

  return next;
}

export function createScalarCompatSpec(schema) {
  const compat = convertNullableTypes(schema);

  compat.openapi = "3.0.3";
  if (compat.info) {
    delete compat.info.summary;
    compat.info.license = {
      name: "NOASSERTION",
      url: "https://spdx.org/licenses/NOASSERTION.html",
    };
  }
  delete compat["x-runtime"];
  delete compat.components;
  if (Array.isArray(compat.servers)) {
    compat.servers = compat.servers.filter((server) => server.url !== "http://127.0.0.1:8787");
  }

  return compat;
}

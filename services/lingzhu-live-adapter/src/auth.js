export function assertAuthorized(request, expectedAk) {
  const authHeader = request.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  const apiKeyHeader = request.headers["x-api-key"] || "";
  const candidate = bearer || apiKeyHeader;

  if (!expectedAk || expectedAk === "replace-me") {
    throw new Error("adapter authAk is not configured");
  }

  if (candidate !== expectedAk) {
    const error = new Error("unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Request-Method": "*",
  Vary: "Accept-Encoding, Origin",
};
export const TYPE = "application/json;charset=UTF-8";
export const DEFAULT_HEADERS = {
  headers: {
    ...CORS_HEADERS,
    "Access-Control-Allow-Headers": "*",
    "Content-Type": TYPE,
  },
};
export const DEFAULT_CACHE_AGE = 60;

import type express from "express";

export const SESSION_COOKIE_NAME = "web_blog_session";

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      if (!name) {
        return cookies;
      }

      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function readSessionToken(request: express.Request): string | undefined {
  const authHeader = request.header("authorization");
  const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  if (bearerToken) {
    return bearerToken;
  }

  const cookies = parseCookieHeader(request.header("cookie"));
  return cookies[SESSION_COOKIE_NAME];
}

function buildCookieValue(value: string, maxAgeSeconds?: number): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  if (typeof maxAgeSeconds === "number") {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }

  return parts.join("; ");
}

export function setSessionCookie(response: express.Response, token: string): void {
  response.append("Set-Cookie", buildCookieValue(token, 60 * 60 * 24 * 30));
}

export function clearSessionCookie(response: express.Response): void {
  response.append("Set-Cookie", buildCookieValue("", 0));
}

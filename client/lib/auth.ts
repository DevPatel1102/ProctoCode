export const AUTH_COOKIE_NAME = "pc_token";

export type UserRole = "admin" | "candidate";

export function getBackendUrl() {
  return process.env.BACKEND_URL ?? "http://localhost:5000";
}

export function getRoleFromToken(token?: string | null): UserRole | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as {
      role?: UserRole;
    };

    return payload.role === "admin" || payload.role === "candidate"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}

export type AuthApiResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

export function getAuthTokenFromBrowser(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.substring(AUTH_COOKIE_NAME.length + 1);
  return decodeURIComponent(value);
}

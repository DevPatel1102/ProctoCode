export const SESSION_ID_COOKIE_NAME = "pc_session_id";
export const SESSION_CODE_COOKIE_NAME = "pc_session_code";

export type CurrentSession = {
  sessionId: string;
  sessionCode: string;
};

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export function getCurrentSessionFromBrowser(): CurrentSession | null {
  const sessionId = getCookieValue(SESSION_ID_COOKIE_NAME);
  const sessionCode = getCookieValue(SESSION_CODE_COOKIE_NAME);

  if (!sessionId || !sessionCode) {
    return null;
  }

  return {
    sessionId,
    sessionCode
  };
}

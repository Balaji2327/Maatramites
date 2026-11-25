const SESSION_LENGTH_MS = 7 * 60 * 60 * 1000;

function sessionDeadline(token: string): number {
  // OTP development sessions carry their creation time directly.
  if (/^auth-token-\d+$/.test(token)) return Number(token.slice("auth-token-".length)) + SESSION_LENGTH_MS;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { iat, exp } = JSON.parse(atob(payload));
    if (Number.isFinite(iat) && Number.isFinite(exp)) {
      return Math.min(iat * 1000 + SESSION_LENGTH_MS, exp * 1000);
    }
  } catch { /* An unreadable session requires a new sign-in. */ }
  return 0;
}

export function createSessionReader(key: string, login: string, clear: () => void) {
  let watching = false;
  let timer: number | undefined;
  let previous: string | null = null;

  function read(): string | null {
    if (typeof window === "undefined") return null;
    if (!watching) {
      watching = true;
      window.addEventListener("storage", event => { if (!event.key || event.key === key) read(); });
      window.addEventListener("pageshow", read);
      window.addEventListener("focus", read);
      document.addEventListener("visibilitychange", read);
    }
    window.clearTimeout(timer);
    const token = localStorage.getItem(key);
    const remaining = token ? sessionDeadline(token) - Date.now() : 0;
    if (token && remaining > 0) {
      previous = token;
      timer = window.setTimeout(read, remaining);
      return token;
    }
    if (token || previous) {
      previous = null;
      clear();
      if (window.location.pathname !== login) window.location.replace(login);
    }
    return null;
  }
  return read;
}

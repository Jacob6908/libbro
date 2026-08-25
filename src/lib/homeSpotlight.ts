const STORAGE_KEY_PREFIX = "libbro:home-spotlight:";

/**
 * Remembers which "currently reading" book the user last focused on the
 * home dashboard, so a reload keeps showing it instead of resetting to the
 * most-recently-touched entry. Client-only (localStorage) - no schema
 * change, no server round trip. Scoped per user id so a shared browser
 * doesn't leak one account's pin into another's.
 */
export function getPinnedSpotlightBookId(userId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + userId);
  } catch {
    return null;
  }
}

export function setPinnedSpotlightBookId(userId: string, bookId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, bookId);
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) - the pin
    // just won't survive a reload.
  }
}

export function clearPinnedSpotlightBookId(userId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + userId);
  } catch {
    // ignore
  }
}

/**
 * Google Books' content endpoint returns 200 OK with either a generic
 * "image not available" graphic or a garbage over-cropped fragment (not an
 * HTTP error) when the requested zoom level isn't available for a given
 * volume - common for print-only/no-preview editions. `zoom=1` is the level
 * Google Books guarantees for any volume that has cover art at all, so it's
 * the safe fallback once a higher zoom has been shown to be broken.
 */
export function getCoverImageFallbackUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("books.google.com")) return null;
    if (parsed.searchParams.get("zoom") === "1") return null;

    parsed.searchParams.set("zoom", "1");
    return parsed.toString();
  } catch {
    return null;
  }
}

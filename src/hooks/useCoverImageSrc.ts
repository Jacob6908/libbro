import { useState, type SyntheticEvent } from "react";
import { getCoverImageFallbackUrl } from "../lib/googleBooksCoverUrl";

/**
 * Real book covers are consistently portrait (Google Books thumbnails run
 * ~1.5-1.7 height/width). The broken responses this guards against are a
 * near-square placeholder graphic, a heavily cropped sliver, or - observed
 * directly against a `books/publisher/content` thumbnail that rendered a
 * scanned interior page instead of a cover - a full page scan at ~1.447.
 * Set just above that measured value, with margin still under the real
 * range so legitimate covers don't trip it.
 */
const MIN_COVER_ASPECT_RATIO = 1.46;

/**
 * Renders `coverImageUrl` with a same-book fallback for Google Books cover
 * requests that come back as a broken placeholder/fragment instead of a
 * real HTTP error (see `getCoverImageFallbackUrl`). Falls back at most once,
 * then hides the image entirely so the caller can show a text placeholder.
 */
export function useCoverImageSrc(
  coverImageUrl: string | null | undefined,
  { validateAspectRatio = false }: { validateAspectRatio?: boolean } = {}
) {
  const [prevCoverImageUrl, setPrevCoverImageUrl] = useState(coverImageUrl);
  const [state, setState] = useState({
    src: coverImageUrl ?? null,
    triedFallback: false,
  });

  // Prop changed without a remount (e.g. BookDetail's cover arrives after an
  // async fetch, in the same component instance) - reset during render
  // rather than in an effect, so the stale/broken src never paints first.
  if (coverImageUrl !== prevCoverImageUrl) {
    setPrevCoverImageUrl(coverImageUrl);
    setState({ src: coverImageUrl ?? null, triedFallback: false });
  }

  function fallbackOrHide() {
    setState((current) => {
      if (current.triedFallback || !current.src) {
        return { src: null, triedFallback: true };
      }
      return {
        src: getCoverImageFallbackUrl(current.src),
        triedFallback: true,
      };
    });
  }

  const handleLoad = validateAspectRatio
    ? (event: SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        if (img.naturalWidth === 0) return;
        if (img.naturalHeight / img.naturalWidth < MIN_COVER_ASPECT_RATIO) {
          fallbackOrHide();
        }
      }
    : undefined;

  function handleError() {
    fallbackOrHide();
  }

  return { src: state.src, handleLoad, handleError };
}

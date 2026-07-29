/**
 * Best-effort mapping from Google Books' freeform BISAC-ish category strings
 * (e.g. "Fiction / Horror", "Juvenile Fiction / Fantasy & Magic") to the
 * curated `genres.slug` taxonomy. Order matters: more specific keywords are
 * checked before generic ones. Anything unmatched is left for
 * `category_aliases` to cache as unmapped, for manual triage later.
 */
const KEYWORD_TO_SLUG: Array<{ keyword: RegExp; slug: string }> = [
  { keyword: /horror/i, slug: "horror" },
  { keyword: /science fiction/i, slug: "science-fiction" },
  { keyword: /fantasy/i, slug: "fantasy" },
  { keyword: /mystery|detective/i, slug: "mystery" },
  { keyword: /thriller|suspense/i, slug: "thriller" },
  { keyword: /romance/i, slug: "romance" },
  { keyword: /historical/i, slug: "historical-fiction" },
  { keyword: /true crime/i, slug: "true-crime" },
  { keyword: /biography|autobiography|memoir/i, slug: "biography-memoir" },
  { keyword: /self-help/i, slug: "self-help" },
  { keyword: /business|economics/i, slug: "business" },
  { keyword: /philosophy/i, slug: "philosophy" },
  { keyword: /poetry/i, slug: "poetry" },
  { keyword: /comics|graphic novels/i, slug: "graphic-novels-comics" },
  { keyword: /humor/i, slug: "humor" },
  { keyword: /health|fitness/i, slug: "health-wellness" },
  { keyword: /travel/i, slug: "travel" },
  { keyword: /young adult/i, slug: "young-adult" },
  { keyword: /juvenile|children/i, slug: "childrens" },
  { keyword: /classics/i, slug: "classics" },
  {
    keyword: /literary criticism|literary collections/i,
    slug: "literary-fiction",
  },
  { keyword: /science/i, slug: "science" },
  { keyword: /fiction/i, slug: "fiction" },
];

/** Returns the best-guess genre slug for a raw category string, or null if nothing matched. */
export function matchGenreSlug(rawCategory: string): string | null {
  for (const { keyword, slug } of KEYWORD_TO_SLUG) {
    if (keyword.test(rawCategory)) {
      return slug;
    }
  }
  return null;
}

/** Falls back to "nonfiction" only when nothing else matched and the string gives no fiction signal. */
export function matchGenreSlugWithFallback(rawCategory: string): string | null {
  const matched = matchGenreSlug(rawCategory);
  if (matched) {
    return matched;
  }
  return /fiction/i.test(rawCategory) ? null : "nonfiction";
}

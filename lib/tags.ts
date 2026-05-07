const HASHTAG_RE = /(?:^|[^&\w])#([\p{L}0-9_-]{1,64})/gu;

export function extractHashtags(md: string): string[] {
  const found = new Set<string>();
  for (const match of md.matchAll(HASHTAG_RE)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

export function parseTagFilter(query: string): { hashtags: string[]; rest: string } {
  const hashtags: string[] = [];
  const rest = query
    .replace(/(?:^|\s)#([\p{L}0-9_-]{1,64})/gu, (_full, tag: string) => {
      hashtags.push(tag.toLowerCase());
      return " ";
    })
    .trim();
  return { hashtags, rest };
}

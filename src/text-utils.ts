import twitterText from 'twitter-text';

export type TextAction = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'remove-line-breaks' | 'clean-spaces';

/** X's standard-post weighted count, using twitter-text v3.1.0 rules. */
export function getXWeightedCharacters(value: string): number {
  return twitterText.parseTweet(value).weightedLength;
}

export function countGraphemes(value: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    let count=0;
    for (const _ of segmenter.segment(value)) count++;
    return count;
  }
  return Array.from(value).length;
}

export function getTextStats(value: string) {
  const trimmed = value.trim();
  const words = trimmed ? (trimmed.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?。！？]+[.!?。！？]*/gu) ?? []).filter((part) => part.trim()).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/u).filter((part) => part.trim()).length : 0;
  return {
    characters: countGraphemes(value),
    charactersNoSpaces: countGraphemes(value.replace(/\s/gu, '')),
    words,
    sentences,
    paragraphs,
    readingMinutes: words ? Math.max(1, Math.ceil(words / 225)) : 0
  };
}

export function transformText(value: string, action: TextAction): string {
  switch (action) {
    case 'uppercase': return value.toLocaleUpperCase();
    case 'lowercase': return value.toLocaleLowerCase();
    case 'titlecase':
      return value.toLocaleLowerCase().replace(
        /(^|[\s([{'"“‘])([\p{L}\p{N}])/gu,
        (_match, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase()
      );
    case 'sentencecase':
      return value.toLocaleLowerCase().replace(
        /(^|[.!?。！？]\s+)([\p{L}])/gu,
        (_match, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase()
      );
    case 'remove-line-breaks':
      return value.replace(/\r\n?|\n/gu, ' ').replace(/\s{2,}/gu, ' ').trim();
    case 'clean-spaces':
      return value.replace(/[ \t]+/gu, ' ').replace(/[ \t]*\n[ \t]*/gu, '\n').replace(/\n{3,}/gu, '\n\n').trim();
    default: return value;
  }
}


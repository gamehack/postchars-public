import twitterText from 'twitter-text';
import { countGraphemes, getXWeightedCharacters } from './text-utils';

export function getXBreakdown(value: string) {
  const links = twitterText.extractUrlsWithIndices(value);
  const chars = typeof Intl.Segmenter !== 'undefined'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), (part) => part.segment)
    : Array.from(value);

  return {
    weighted: getXWeightedCharacters(value),
    visibleCharacters: countGraphemes(value),
    links: links.length,
    emoji: chars.filter((char) => /\p{Extended_Pictographic}/u.test(char)).length,
    remaining: 280 - getXWeightedCharacters(value)
  };
}

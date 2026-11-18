import { SOCIAL_RULES, unitCount, type CountUnit, type PlatformKey } from './platform-rules';

export type MainPlatformId = 'x' | 'instagram' | 'linkedin' | 'threads' | 'youtube';
export type CrossPlatformId = MainPlatformId | PlatformKey;
export type Confidence = 'official' | 'reference';

export interface CrossPlatformRule {
  id: CrossPlatformId;
  name: string;
  field: string;
  limit: number | null;
  unit: CountUnit;
  confidence: Confidence;
  source: string;
  scope: string;
  note: string;
  maxUtf8Bytes?: number;
}

const direct: Record<MainPlatformId, CrossPlatformRule> = {
  x: {
    id: 'x', name: 'X / Twitter', field: 'Standard post', limit: 280,
    unit: 'x-weighted', confidence: 'reference',
    source: 'https://github.com/twitter/twitter-text',
    scope: 'Standard posts; paid and longer post formats vary',
    note: 'Uses twitter-text v3 weighting for URLs, emoji and many CJK characters. The X composer is the final validator.'
  },
  instagram: {
    id: 'instagram', name: 'Instagram', field: 'Caption', limit: 2200,
    unit: 'graphemes', confidence: 'reference',
    source: 'https://help.instagram.com/',
    scope: 'Common caption-length reference, not an API validator',
    note: 'Visible graphemes are an estimate. Emoji and new product rules may be counted differently by Instagram.'
  },
  linkedin: {
    id: 'linkedin', name: 'LinkedIn', field: 'Post', limit: 3000,
    unit: 'graphemes', confidence: 'reference',
    source: 'https://www.linkedin.com/help/linkedin/answer/a528176',
    scope: 'Ordinary profile post; not long-form articles',
    note: 'The published 3,000-character limit is a reference. Visible graphemes may differ from LinkedIn validation.'
  },
  threads: {
    id: 'threads', name: 'Threads', field: 'Standard post', limit: 500,
    unit: 'graphemes', confidence: 'reference',
    source: 'https://help.instagram.com/',
    scope: 'Common standard post limit; extended text formats differ',
    note: 'This is a reference check, not a live Threads composer validation.'
  },
  youtube: {
    id: 'youtube', name: 'YouTube', field: 'Video title', limit: 100,
    unit: 'graphemes', confidence: 'reference',
    source: 'https://support.google.com/youtube/',
    scope: 'Video title, not video description',
    note: 'A visible-character planning estimate. YouTube may enforce additional restrictions.'
  }
};

const fromExisting = (id: PlatformKey): CrossPlatformRule => {
  const r = SOCIAL_RULES[id];
  return {
    id, name: r.label, field: r.field, limit: r.limit, unit: r.unit,
    confidence: r.confidence, source: r.source, scope: r.scope,
    note: r.note, maxUtf8Bytes: r.maxUtf8Bytes
  };
};

// Existing standalone social tools and the cross-platform checker share
// one source for counting units, limits, byte caps and applicability notes.
export const CROSS_PLATFORM_RULES: Record<CrossPlatformId, CrossPlatformRule> = {
  ...direct,
  tiktok: fromExisting('tiktok'),
  bluesky: fromExisting('bluesky'),
  reddit: fromExisting('reddit'),
  discord: fromExisting('discord'),
  telegram: fromExisting('telegram'),
  facebook: fromExisting('facebook'),
  pinterest: fromExisting('pinterest')
};

export const CROSS_PLATFORM_IDS: readonly CrossPlatformId[] = [
  'x', 'instagram', 'linkedin', 'threads', 'youtube',
  'tiktok', 'bluesky', 'reddit', 'discord', 'telegram',
  'facebook', 'pinterest'
];

export const MAIN_PLATFORMS: { id: MainPlatformId; name: string; limit: number; detail: string }[] =
  (['x', 'instagram', 'linkedin', 'threads', 'youtube'] as MainPlatformId[])
    .map(id => {
      const r = CROSS_PLATFORM_RULES[id];
      return { id, name: id === 'x' ? 'X' : r.name, limit: r.limit!, detail: id === 'threads' ? 'Post' : r.field };
    });

export interface CrossPlatformResult {
  rule: CrossPlatformRule;
  count: number;
  remaining: number | null;
  overCount: boolean;
  overBytes: boolean;
  overLimit: boolean;
  utf8Bytes: number | null;
}

function result(rule: CrossPlatformRule, count: number, utf8Bytes: number | null): CrossPlatformResult {
  const overCount = rule.limit !== null && count > rule.limit;
  const overBytes = rule.maxUtf8Bytes !== undefined && utf8Bytes !== null && utf8Bytes > rule.maxUtf8Bytes;
  return {
    rule, count, remaining: rule.limit === null ? null : rule.limit - count,
    overCount, overBytes, overLimit: overCount || overBytes, utf8Bytes
  };
}

export function checkPostText(text: string, id: CrossPlatformId): CrossPlatformResult {
  const rule = CROSS_PLATFORM_RULES[id];
  const bytes = rule.maxUtf8Bytes !== undefined ? new TextEncoder().encode(text).length : null;
  return result(rule, unitCount(text, rule.unit), bytes);
}

export function checkAllPosts(text: string): CrossPlatformResult[] {
  // Expensive text weighting is calculated once per unit, not once per card.
  const cache = new Map<CountUnit, number>();
  let bytes: number | null = null;
  return CROSS_PLATFORM_IDS.map(id => {
    const rule = CROSS_PLATFORM_RULES[id];
    if (!cache.has(rule.unit)) cache.set(rule.unit, unitCount(text, rule.unit));
    if (rule.maxUtf8Bytes !== undefined && bytes === null) bytes = new TextEncoder().encode(text).length;
    return result(rule, cache.get(rule.unit)!, rule.maxUtf8Bytes === undefined ? null : bytes);
  });
}

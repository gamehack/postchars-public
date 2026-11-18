import { describe, expect, it } from 'vitest';
import {
  CROSS_PLATFORM_IDS, CROSS_PLATFORM_RULES, MAIN_PLATFORMS,
  checkAllPosts, checkPostText
} from '../src/cross-platform-rules';
import { analyzePlatformText, SOCIAL_RULES } from '../src/platform-rules';

describe('cross-platform shared rules', () => {
  it('covers 12 distinct fields, with only five main editor choices', () => {
    expect(CROSS_PLATFORM_IDS.length).toBe(12);
    expect(new Set(CROSS_PLATFORM_IDS).size).toBe(12);
    expect(MAIN_PLATFORMS).toHaveLength(5);
    expect(CROSS_PLATFORM_IDS.every(id => CROSS_PLATFORM_RULES[id])).toBe(true);
  });

  it('uses the same weighted X calculation and visible counting as the main editor', () => {
    expect(checkPostText('中文', 'x').count).toBe(4);
    expect(checkPostText('中文', 'instagram').count).toBe(2);
    expect(checkPostText('中文', 'linkedin').count).toBe(2);
    expect(checkPostText('中文', 'tiktok').count).toBe(2);
  });

  it('preserves the standalone social rule source and its scoped limits', () => {
    for (const id of ['tiktok', 'bluesky', 'reddit', 'discord', 'telegram', 'facebook', 'pinterest'] as const) {
      const fromMatrix = CROSS_PLATFORM_RULES[id];
      const fromStandalone = SOCIAL_RULES[id];
      expect(fromMatrix.limit).toEqual(fromStandalone.limit);
      expect(fromMatrix.unit).toEqual(fromStandalone.unit);
      expect(fromMatrix.source).toEqual(fromStandalone.source);
      const text = 'Hello 中文 👩‍💻';
      expect(checkPostText(text, id).count).toEqual(analyzePlatformText(text, fromStandalone).count);
    }
  });

  it('checks both the 300 grapheme and 3000-byte Bluesky limits', () => {
    const simple = checkPostText('😀'.repeat(300), 'bluesky');
    expect(simple.count).toBe(300);
    expect(simple.overLimit).toBe(false);
    const joined = checkPostText('👩‍💻'.repeat(300), 'bluesky');
    expect(joined.count).toBe(300);
    expect(joined.utf8Bytes).toBe(3300);
    expect(joined.overBytes).toBe(true);
    expect(joined.overLimit).toBe(true);
  });

  it('does not fabricate a universal Facebook limit', () => {
    const facebook = checkPostText('A post', 'facebook');
    expect(facebook.rule.limit).toBeNull();
    expect(facebook.remaining).toBeNull();
    expect(facebook.overLimit).toBe(false);
  });

  it('keeps over-limit results and byte caps consistent in bulk evaluation', () => {
    const text = '👩‍💻'.repeat(300);
    const all = checkAllPosts(text);
    expect(all).toHaveLength(12);
    expect(all.find(x => x.rule.id === 'bluesky')?.overBytes).toBe(true);
    for (const row of all) {
      expect(row.count).toEqual(checkPostText(text, row.rule.id).count);
      expect(row.remaining).toEqual(checkPostText(text, row.rule.id).remaining);
      expect(row.overLimit).toEqual(checkPostText(text, row.rule.id).overLimit);
    }
  });

  it('does not upload or mutate text during calculations', () => {
    const text = 'PRIVATE DRAFT https://postchars.com';
    const before = text;
    const output = checkAllPosts(text);
    expect(text).toBe(before);
    expect(output.map(r => r.rule.id)).toEqual(CROSS_PLATFORM_IDS);
  });
});

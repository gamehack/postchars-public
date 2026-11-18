import { existsSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('public release advertising boundary', () => {
  test('publisher-specific ad frames are not shipped', () => {
    for (const name of ['native-ad-frame.html', 'guide-ad-frame.html']) {
      expect(existsSync(new URL('../public/' + name, import.meta.url))).toBe(false);
    }
  });

  test('publisher verification files are not shipped', () => {
    for (const name of ['ads.txt', 'indexnow-key.txt', 'guide-ad-config.js']) {
      expect(existsSync(new URL('../public/' + name, import.meta.url))).toBe(false);
    }
  });
});

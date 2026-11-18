import { describe, it, expect } from 'vitest';
import { parseStoredConsent } from '../src/consent';

const NOW=1_800_000_000_000;
function record(analytics: boolean, advertising: boolean, updatedAt: number): string {
  return JSON.stringify({ analytics, advertising, updatedAt });
}
describe('persisted consent validity', () => {
  it('restores a recent explicit choice', () => {
    expect(parseStoredConsent(record(false,true,NOW-1000),NOW)).toEqual({analytics:false,advertising:true});
  });
  it('expires choices older than 180 days', () => {
    expect(parseStoredConsent(record(true,true,NOW-181*24*60*60*1000),NOW)).toBeNull();
  });
  it('does not trust future-dated consent records', () => {
    expect(parseStoredConsent(record(true,true,NOW+1000),NOW)).toBeNull();
  });
  it('rejects malformed values without throwing', () => {
    expect(parseStoredConsent('not json',NOW)).toBeNull();
    expect(parseStoredConsent('{"analytics":"yes","advertising":true,"updatedAt":100}',NOW)).toBeNull();
    expect(parseStoredConsent('{"analytics":false,"advertising":false,"updatedAt":null}',NOW)).toBeNull();
  });
  it('keeps a refusal valid until its expiry', () => {
    expect(parseStoredConsent(record(false,false,NOW),NOW)).toEqual({analytics:false,advertising:false});
  });
});

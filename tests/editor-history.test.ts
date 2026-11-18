import {describe,it,expect} from 'vitest';
import {boundedHistory,DRAFT_SAVE_DELAY_MS,HISTORY_GROUP_DELAY_MS} from '../src/editor-history';
describe('bounded editor history',()=>{
 it('keeps recent versions within entry count',()=>{expect(boundedHistory(['a','b'],'c',2)).toEqual(['b','c']);});
 it('enforces total UTF-16 units in memory',()=>{expect(boundedHistory(['a'.repeat(7)],'b'.repeat(7),60,10)).toEqual(['b'.repeat(7)]);});
 it('does not record an oversized document',()=>{expect(boundedHistory(['safe'],'a'.repeat(20),60,10)).toEqual(['safe']);});
 it('does not mutate prior history arrays',()=>{const past=['x'];boundedHistory(past,'y');expect(past).toEqual(['x']);});
 it('uses bounded input-event coalescing and delayed persistence',()=>{expect(HISTORY_GROUP_DELAY_MS).toBeLessThan(DRAFT_SAVE_DELAY_MS);});
});

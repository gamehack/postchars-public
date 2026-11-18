/** Memory-bounded snapshots for undo/redo. Limit by UTF-16 storage units and count. */
export function boundedHistory(entries: readonly string[], previous: string, maxEntries=60, maxCodeUnits=750_000): string[] {
  if (previous.length > maxCodeUnits || maxEntries < 1 || maxCodeUnits < 1) return [...entries];
  const next=[...entries, previous];
  let total=next.reduce((sum,item)=>sum+item.length,0);
  while(next.length > maxEntries || total > maxCodeUnits){
    const removed=next.shift();
    if(removed!==undefined)total-=removed.length;
  }
  return next;
}
/** Draft writes are delayed while typing; pagehide flush must still persist recent edits. */
export const DRAFT_SAVE_DELAY_MS=750;
export const HISTORY_GROUP_DELAY_MS=700;

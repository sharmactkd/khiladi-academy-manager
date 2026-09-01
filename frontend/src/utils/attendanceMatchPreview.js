// Preview needs identity only, not the potentially enormous attendance history.
export const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function prepareMatchPreview(blocks, onProgress = () => {}) {
  const identities = new Map();
  let processed = 0;
  for (const block of blocks) {
    for (const [index, row] of (block.rows || []).entries()) {
      const identity = {
        sourceSheet: row.sourceSheet,
        rowNumber: row.rowNumber,
        importedRowNumber: row.importedRowNumber || row.rowNumber || index + 2,
        name: row.name, phone: row.phone,
        admissionNumber: row.admissionNumber, studentCode: row.studentCode,
        batchName: row.batchName,
      };
      // Never collapse siblings by phone or people by name alone.
      const key = JSON.stringify(identity);
      const existing = identities.get(key);
      const cells = (row.attendance || []).filter((cell) => cell.status).length;
      if (existing) existing.cells += cells;
      else identities.set(key, { row: identity, cells });
      processed += 1;
      if (processed % 500 === 0) {
        onProgress(processed);
        await yieldToBrowser();
      }
    }
  }
  return Array.from(identities.values());
}

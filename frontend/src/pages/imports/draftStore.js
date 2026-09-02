// Local opt-in draft. Scoped by authenticated operator; workbook stays on device.
function open() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("khiladi-import-drafts-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function draftStore(key, value, remove = false) {
  const db = await open();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", value === undefined && !remove ? "readonly" : "readwrite");
    const store = tx.objectStore("drafts");
    const request = remove ? store.delete(key) : value === undefined ? store.get(key) : store.put(value, key);
    let result;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Draft not saved"));
  }); } finally { db.close(); }
}

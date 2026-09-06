export const getStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const setStoredJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeStoredItem = (key) => {
  localStorage.removeItem(key);
};
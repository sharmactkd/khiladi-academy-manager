export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const millisecondsUntilLocalMidnight = (date = new Date()) => {
  const midnight = new Date(date);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, midnight.getTime() - date.getTime());
};

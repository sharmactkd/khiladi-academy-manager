export const joinAddress = (value) => [value?.address, value?.city, value?.state, value?.country].filter(Boolean).join(", ");
export const pretty = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const studentName = (student) => student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "Student";

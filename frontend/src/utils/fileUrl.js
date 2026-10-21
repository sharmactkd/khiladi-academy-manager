export const getApiOrigin = () => {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

  return String(apiUrl).replace(/\/api\/?$/, "").replace(/\/$/, "");
};

export const getFileUrl = (path, fallback = "") => {
  if (!path) return fallback;

  const value = String(path);

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${getApiOrigin()}${value.startsWith("/") ? value : `/${value}`}`;
};

export const getStudentInitials = student => {
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || student?.name || student?.importedName || "Student";
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0] || "").join("").toUpperCase();
};

export const getStudentInitialsAvatar = student => {
  const initials = getStudentInitials(student).replace(/[&<>"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="#fff0f1"/><text x="60" y="64" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="600" fill="#b71925">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const handleStudentPhotoError = (event, student) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = getStudentInitialsAvatar(student);
};

export const getStudentPhotoUrl = (
  student,
  fallback
) => {
  return getFileUrl(student?.profilePhoto || student?.photo, fallback ?? getStudentInitialsAvatar(student));
};

export const getAcademyLogoUrl = (academy, fallback = "") => {
  return getFileUrl(academy?.logo, fallback);
};

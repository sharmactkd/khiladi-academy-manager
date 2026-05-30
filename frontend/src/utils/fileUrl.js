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

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${getApiOrigin()}${value.startsWith("/") ? value : `/${value}`}`;
};

export const getStudentPhotoUrl = (
  student,
  fallback = "/default-avatar.png"
) => {
  return getFileUrl(student?.profilePhoto || student?.photo, fallback);
};

export const getAcademyLogoUrl = (academy, fallback = "") => {
  return getFileUrl(academy?.logo, fallback);
};
export const getRoleLandingPath = (role) => {
  if (role === "super_admin") return "/admin";
  if (role === "parent" || role === "student") return "/parent";
  return "/dashboard";
};

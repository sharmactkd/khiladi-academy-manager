import mongoose from "mongoose";

export const getAssistantCoachBranchIds = (user) => {
  if (!user || user.role !== "assistant_coach") {
    return [];
  }

  const values = [
    ...(Array.isArray(user.$locals?.authorizedBranchIds)
      ? user.$locals.authorizedBranchIds
      : []),
    user.branch,
    user.branchId,
    user.assignedBranch,
    ...(Array.isArray(user.branches) ? user.branches : []),
    ...(Array.isArray(user.assignedBranches)
      ? user.assignedBranches
      : []),
  ].filter(Boolean);

  return [...new Set(values.map((v) => String(v)))];
};

export const buildBranchAccessFilter = (user) => {
  if (!user || user.role !== "assistant_coach") {
    return {};
  }

  const branchIds = getAssistantCoachBranchIds(user);

  if (!branchIds.length) {
    return {
      branch: {
        $in: [],
      },
    };
  }

  return {
    branch: {
      $in: branchIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    },
  };
};

export const canAccessBranch = (user, branchId) => {
  if (!user || user.role !== "assistant_coach") return true;
  if (!branchId) return false;
  return getAssistantCoachBranchIds(user).includes(String(branchId));
};

export const assertBranchAccess = (user, branchId) => {
  if (!canAccessBranch(user, branchId)) {
    const error = new Error("You are not authorized to manage the selected branch");
    error.statusCode = 403;
    throw error;
  }
};

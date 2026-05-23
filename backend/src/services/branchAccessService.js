import mongoose from "mongoose";

export const getAssistantCoachBranchIds = (user) => {
  if (!user || user.role !== "assistant_coach") {
    return [];
  }

  const values = [
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
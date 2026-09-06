import { useEffect, useMemo, useState } from "react";

import { academyApi } from "../api/academyApi.js";
import { getBranches } from "../api/branchApi.js";
import { getAcademyLogoUrl } from "../utils/fileUrl.js";

const listFrom = (payload) => {
  const candidates = [
    payload?.data?.data?.branches,
    payload?.data?.data,
    payload?.data?.branches,
    payload?.data,
    payload?.branches,
    payload,
  ];

  return candidates.find(Array.isArray) || [];
};

const academyFrom = (response) =>
  response?.data?.data?.academy || response?.data?.academy || null;

const useSidebarWorkspace = ({ enabled = true } = {}) => {
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let alive = true;

    Promise.allSettled([
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
    ]).then(([academyResult, branchesResult]) => {
      if (!alive) return;

      if (academyResult.status === "fulfilled") {
        setAcademy(academyFrom(academyResult.value));
      }

      if (branchesResult.status === "fulfilled") {
        setBranches(listFrom(branchesResult.value));
      }

      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return useMemo(() => {
    const activeBranches = branches.filter((branch) => branch?.isActive !== false);
    const mainBranch =
      activeBranches.find((branch) => branch?.isMainBranch) ||
      activeBranches[0] ||
      null;

    return {
      academy,
      branches: activeBranches,
      mainBranch,
      loading,
      academyName: academy?.academyName || academy?.name || "KHILADI Academy",
      logoUrl: academy?.logo ? getAcademyLogoUrl(academy) : "",
    };
  }, [academy, branches, loading]);
};

export default useSidebarWorkspace;


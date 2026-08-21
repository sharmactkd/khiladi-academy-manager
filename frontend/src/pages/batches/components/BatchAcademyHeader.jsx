import { useCallback, useEffect, useMemo, useState } from "react";

import { academyApi } from "../../../api/academyApi.js";
import { batchApi } from "../../../api/batchApi.js";
import { getBranches } from "../../../api/branchApi.js";
import AcademyHeroHeader from "../../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../../utils/fileUrl.js";
import { joinAddressParts, unwrapList } from "../batch.utils.js";

const BatchAcademyHeader = ({ branch = null }) => {
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  const loadHeader = useCallback(async () => {
    const [academyResult, branchesResult, batchesResult] = await Promise.allSettled([
      academyApi.getMyAcademy(), getBranches({ status: "all" }), batchApi.getAll(),
    ]);
    if (academyResult.status === "fulfilled") setAcademy(academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null);
    setBranches(branchesResult.status === "fulfilled" ? unwrapList(branchesResult.value) : []);
    setBatches(batchesResult.status === "fulfilled" ? unwrapList(batchesResult.value) : []);
  }, []);

  useEffect(() => { loadHeader(); }, [loadHeader]);

  const activeBranches = useMemo(() => branches.filter((item) => item?.isActive !== false), [branches]);
  const mainBranch = branch || branches.find((item) => item?.isMainBranch) || activeBranches[0] || null;
  const activeBatchCount = batches.filter((item) => item?.isActive !== false).length;
  const address = joinAddressParts([
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ]);

  return (
    <AcademyHeroHeader
      headingId="batch-academy-name"
      academyName={academy?.academyName || "KHILADI Academy"}
      ownerName={academy?.ownerName || user?.name || "Academy Owner"}
      logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
      addressLabel={mainBranch?.branchName || "Main Branch"}
      address={address || "Complete branch address not available"}
      summaryItems={[
        { key: "branches", type: "branches", value: activeBranches.length, label: "Active Branches" },
        { key: "batches", type: "batches", value: activeBatchCount, label: "Active Batches" },
      ]}
    />
  );
};

export default BatchAcademyHeader;

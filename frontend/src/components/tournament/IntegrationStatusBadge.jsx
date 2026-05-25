const IntegrationStatusBadge = ({ status }) => {
  const value = status || "inactive";

  const labelMap = {
    active: "Active",
    inactive: "Inactive",
    error: "Error",
    pending: "Pending",
    synced: "Synced",
    failed: "Failed",
    cancelled: "Cancelled",
    imported: "Imported",
    duplicate: "Duplicate",
  };

  return (
    <span className={`badge badge-${value}`}>
      {labelMap[value] || value}
    </span>
  );
};

export default IntegrationStatusBadge;
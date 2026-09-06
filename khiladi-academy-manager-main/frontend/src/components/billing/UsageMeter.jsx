const UsageMeter = ({ label, used = 0, limit = 0 }) => {
  const isUnlimited = limit === "unlimited";
  const percentage = isUnlimited
    ? 0
    : Math.min(Math.round((Number(used || 0) / Number(limit || 1)) * 100), 100);

  return (
    <div className="usage-meter">
      <div className="usage-meter-header">
        <strong>{label}</strong>
        <span>
          {used} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>

      <div className="usage-meter-track">
        <div
          className="usage-meter-fill"
          style={{ width: `${isUnlimited ? 100 : percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UsageMeter;
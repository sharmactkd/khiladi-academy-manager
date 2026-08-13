import MetricCard from "../../../components/common/MetricCard.jsx";

const BranchStatCard = ({ icon, label, value, tone = "red" }) => (
  <MetricCard className={`branches-stat branches-stat--${tone}`} icon={icon} iconSize={22} label={label} value={value} />
);

export default BranchStatCard;

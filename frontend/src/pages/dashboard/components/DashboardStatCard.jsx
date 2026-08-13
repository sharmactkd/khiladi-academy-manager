import MetricCard from "../../../components/common/MetricCard.jsx";

const DashboardStatCard = ({ icon, title, value, tone = "red", subtitle }) => (
  <MetricCard className={`owner-stat owner-stat--${tone}`} classNames={{ icon: "owner-stat__icon", copy: "owner-stat__copy" }} copyAs="span" icon={icon} iconSize={23} iconStrokeWidth={2.2} label={title} value={value} subtitle={subtitle} />
);

export default DashboardStatCard;

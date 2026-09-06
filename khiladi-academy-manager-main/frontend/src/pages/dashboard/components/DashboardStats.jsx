import MetricGrid from "../../../components/common/MetricGrid.jsx";

const DashboardStats = ({ items }) => <MetricGrid className="owner-stats" items={items.map(({ title, ...item }) => ({ ...item, id: title, label: title }))} getCardProps={(item) => ({ className: `owner-stat owner-stat--${item.tone || "red"}`, classNames: { icon: "owner-stat__icon", copy: "owner-stat__copy" }, copyAs: "span", iconSize: 23, iconStrokeWidth: 2.2 })} />;

export default DashboardStats;

import DashboardStatCard from "./DashboardStatCard.jsx";

const DashboardStats = ({ items }) => (
  <section className="owner-stats" aria-label="Academy summary">
    {items.map((item) => (
      <DashboardStatCard key={item.title} {...item} />
    ))}
  </section>
);

export default DashboardStats;

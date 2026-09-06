import clsx from "clsx";
import MetricCard from "./MetricCard.jsx";
import styles from "./MetricGrid.module.css";

const MetricGrid = ({ className = "", getCardProps, items = [] }) => (
  <section className={clsx(styles.grid, className)} aria-label="Summary metrics">
    {items.filter(Boolean).map((item, index) => (
      <MetricCard key={item.id || item.label || index} {...item} {...getCardProps?.(item, index)} />
    ))}
  </section>
);

export default MetricGrid;

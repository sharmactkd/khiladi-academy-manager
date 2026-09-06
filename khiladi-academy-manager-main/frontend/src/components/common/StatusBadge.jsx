import clsx from "clsx";
import styles from "./StatusBadge.module.css";

const StatusBadge = ({ className = "", icon: Icon, label, tone = "neutral" }) => (
  <span className={clsx(styles.badge, styles[tone], className)}>{Icon ? <Icon aria-hidden="true" /> : null}<i aria-hidden="true" />{label}</span>
);

export default StatusBadge;

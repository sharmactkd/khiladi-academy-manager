import clsx from "clsx";
import styles from "./PageState.module.css";

const PageState = ({ action, children, className = "", icon: Icon, iconClassName = "", loading = false, title }) => (
  <div className={clsx(styles.root, className)} aria-live={loading ? "polite" : undefined}>
    {Icon ? <Icon className={clsx(iconClassName, loading && styles.spin)} aria-hidden="true" /> : null}
    <strong>{title}</strong>
    {children}
    {action}
  </div>
);

export default PageState;

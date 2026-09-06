import clsx from "clsx";
import styles from "./MetricCard.module.css";

const MetricCard = ({ as: Root = "article", classNames = {}, className = "", copyAs: Copy = "div", flat = false, icon: Icon, iconSize, iconStrokeWidth, label, value, subtitle }) => (
  <Root className={clsx(styles.root, className, classNames.root)}>
    {Icon ? <span className={clsx(styles.icon, classNames.icon)}><Icon size={iconSize} strokeWidth={iconStrokeWidth} aria-hidden="true" /></span> : null}
    {flat ? <><span className={classNames.label}>{label}</span><strong className={classNames.value}>{value}</strong></> : <Copy className={clsx(styles.copy, classNames.copy)}>
      <small className={classNames.label}>{label}</small>
      <strong className={classNames.value}>{value}</strong>
      {subtitle ? <span className={classNames.subtitle}>{subtitle}</span> : null}
    </Copy>}
  </Root>
);

export default MetricCard;

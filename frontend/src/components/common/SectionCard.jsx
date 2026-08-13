import clsx from "clsx";
import SectionHeader from "./SectionHeader.jsx";
import styles from "./SectionCard.module.css";

const SectionCard = ({ children, className = "", contentClassName = "", header = null, ...headerProps }) => (
  <section className={clsx(styles.card, className)}>
    {header || (headerProps.title ? <SectionHeader {...headerProps} /> : null)}
    <div className={clsx(styles.content, contentClassName)}>{children}</div>
  </section>
);

export default SectionCard;

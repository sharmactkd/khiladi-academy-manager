import styles from "./DocumentStudio.module.css";

const DocumentStudioSection = ({ number, title, description, children, className = "" }) => (
  <section className={`${styles.section} ${className}`}>
    <header className={styles.sectionHeader}>
      <span>{String(number).padStart(2, "0")}</span>
      <div><h3>{title}</h3><p>{description}</p></div>
    </header>
    <div className={styles.sectionBody}>{children}</div>
  </section>
);

export default DocumentStudioSection;

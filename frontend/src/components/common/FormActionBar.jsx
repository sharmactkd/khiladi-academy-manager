import clsx from "clsx";
import styles from "./FormActionBar.module.css";

const FormActionBar = ({ actions, className = "", description, icon: Icon, title }) => (
  <footer className={clsx(styles.root, className)}>
    {(title || description) ? <div className={styles.summary}>{Icon ? <Icon aria-hidden="true" /> : null}<span>{title ? <strong>{title}</strong> : null}{description ? <small>{description}</small> : null}</span></div> : null}
    <div className={styles.actions}>{actions}</div>
  </footer>
);

export default FormActionBar;

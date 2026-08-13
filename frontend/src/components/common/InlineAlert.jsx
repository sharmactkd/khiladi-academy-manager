import clsx from "clsx";
import styles from "./InlineAlert.module.css";

const InlineAlert = ({ action, className = "", icon: Icon, message, tone = "error" }) => {
  if (!message) return null;
  return <div className={clsx(styles.root, styles[tone], className)} role={tone === "error" ? "alert" : "status"}>{Icon ? <Icon aria-hidden="true" /> : null}<span>{message}</span>{action}</div>;
};

export default InlineAlert;

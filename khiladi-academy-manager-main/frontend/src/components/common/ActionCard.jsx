import { Link } from "react-router-dom";
import clsx from "clsx";
import styles from "./ActionCard.module.css";

const ActionCard = ({ className = "", icon: Icon, label, onClick, to }) => {
  const content = <><Icon aria-hidden="true" /><span>{label}</span></>;
  if (to) return <Link className={clsx(styles.card, className)} to={to}>{content}</Link>;
  return <button className={clsx(styles.card, className)} type="button" onClick={onClick}>{content}</button>;
};

export default ActionCard;

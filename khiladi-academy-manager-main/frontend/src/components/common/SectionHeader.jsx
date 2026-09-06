import clsx from "clsx";
import styles from "./SectionHeader.module.css";

const SectionHeader = ({
  action = null,
  classNames = {},
  description,
  eyebrow,
  eyebrowElement: EyebrowElement = "small",
  icon: Icon,
  iconInsideCopy = false,
  title,
}) => (
  <header className={clsx(styles.root, classNames.root)}>
    {Icon && !iconInsideCopy ? (
      <span className={clsx(styles.icon, classNames.icon)}>
        <Icon size={19} aria-hidden="true" />
      </span>
    ) : null}
    <div className={clsx(styles.copy, classNames.copy)}>
      {Icon && iconInsideCopy ? <Icon aria-hidden="true" /> : null}
      {eyebrow ? <EyebrowElement className={classNames.eyebrow}>{eyebrow}</EyebrowElement> : null}
      <h2 className={classNames.title}>{title}</h2>
      {description ? <p className={classNames.description}>{description}</p> : null}
    </div>
    {action ? <div className={clsx(styles.action, classNames.action)}>{action}</div> : null}
  </header>
);

export default SectionHeader;

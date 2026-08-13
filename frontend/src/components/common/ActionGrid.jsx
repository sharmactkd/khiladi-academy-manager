import clsx from "clsx";
import ActionCard from "./ActionCard.jsx";
import SectionHeader from "./SectionHeader.jsx";
import styles from "./ActionGrid.module.css";

const ActionGrid = ({ className = "", gridClassName = "", headerClassNames, items = [], eyebrow, title }) => (
  <article className={clsx(styles.panel, className)}>
    {(title || eyebrow) ? <SectionHeader classNames={headerClassNames} eyebrow={eyebrow} eyebrowElement="span" title={title} /> : null}
    <div className={clsx(styles.grid, gridClassName)}>
      {items.filter(Boolean).map((item, index) => <ActionCard key={item.id || item.to || index} {...item} />)}
    </div>
  </article>
);

export default ActionGrid;

import { Check } from "lucide-react";

const ReportTypeCatalog = ({ types, value, onChange, styles }) => (
  <section className={styles.catalog} aria-label="Report types">
    <header><div><small>01 · Report library</small><h2>Choose a report</h2><p>Select the official record you want to generate.</p></div><span>{types.length} report types</span></header>
    <div className={styles.catalogGrid}>{types.map((type) => { const Icon = type.icon; const selected = type.id === value; return <button type="button" key={type.id} className={`${styles.reportType} ${styles[`tone${type.tone[0].toUpperCase()}${type.tone.slice(1)}`]} ${selected ? styles.selectedType : ""}`} onClick={() => onChange(type.id)}><span className={styles.typeIcon}><Icon size={20}/></span><span className={styles.typeCopy}><strong>{type.label}</strong><small>{type.description}</small></span>{selected ? <i><Check size={13}/></i> : null}</button>; })}</div>
  </section>
);

export default ReportTypeCatalog;

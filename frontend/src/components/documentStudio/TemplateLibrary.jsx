import { Archive, Copy, Pencil, Star } from "lucide-react";
import styles from "./DocumentStudio.module.css";

const TemplateLibrary = ({ templates, renderPreview, onEdit, onDuplicate, onArchive, onSetDefault }) => (
  <section className={styles.library}>
    <header><div><span>TEMPLATE LIBRARY</span><h2>Saved designs</h2><p>Reuse, duplicate and safely archive versioned templates.</p></div><strong>{templates.length} templates</strong></header>
    <div className={styles.libraryGrid}>
      {templates.map((template) => <article key={template._id}>
        <div className={styles.libraryPreview}>{renderPreview(template)}</div>
        <div className={styles.libraryMeta}><div><h3>{template.templateName}</h3><p>v{template.version || 1} · {template.status || "draft"}</p></div>{template.isDefault ? <span><Star size={13} fill="currentColor"/> Default</span> : null}</div>
        <div className={styles.libraryActions}>
          <button type="button" onClick={() => onEdit(template)}><Pencil size={15}/>Edit</button>
          <button type="button" onClick={() => onDuplicate(template)}><Copy size={15}/>Duplicate</button>
          {!template.isDefault ? <button type="button" onClick={() => onSetDefault(template)}><Star size={15}/>Default</button> : null}
          <button type="button" className={styles.danger} onClick={() => onArchive(template)}><Archive size={15}/>Archive</button>
        </div>
      </article>)}
      {!templates.length ? <div className={styles.empty}>No saved templates yet. Build and publish your first design.</div> : null}
    </div>
  </section>
);

export default TemplateLibrary;

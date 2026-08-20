import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ShieldCheck } from "lucide-react";
import { idCardApi } from "../../api/idCardApi.js";
import IdCardPreview from "../../components/idCards/IdCardPreview.jsx";
import styles from "./IdCardWorkflow.module.css";

const PrintIdCard = () => { const { id } = useParams(); const [card, setCard] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { idCardApi.getById(id).then((response) => setCard(response.data?.data?.idCard || null)).finally(() => setLoading(false)); }, [id]); if (loading) return <div className={styles.loading}>Preparing print preview…</div>; if (!card) return <div className={styles.loading}>ID card not found.</div>; return <div className={`page ${styles.printPage}`}><header className={`${styles.printHeader} no-print`}><div><ShieldCheck/><span><small>PRINT PRODUCTION</small><h1>CR80 ID Card Output</h1><p>Front and back are rendered from the immutable issued-card snapshot.</p></span></div><div><Link to="/id-cards/generate">Back</Link><button type="button" onClick={() => window.print()}><Printer/>Print / Save PDF</button></div></header><div className={styles.printSheet}><div><span>FRONT</span><IdCardPreview idCard={card} side="front"/></div><div><span>BACK</span><IdCardPreview idCard={card} side="back"/></div></div></div>; };
export default PrintIdCard;

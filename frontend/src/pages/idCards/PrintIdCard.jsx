import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, Printer, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { idCardApi } from "../../api/idCardApi.js";
import IdCardPreview from "../../components/idCards/IdCardPreview.jsx";
import { getTemplateSize } from "./idCardTemplate.config.js";
import baseStyles from "./IdCardWorkflow.module.css";
import enhancements from "./IdCardEnhancements.module.css";

const styles = { ...baseStyles, ...enhancements };

const PrintIdCard = ({ batch = false }) => {
  const { id } = useParams(); const [params] = useSearchParams(); const [cards, setCards] = useState([]); const [loading, setLoading] = useState(true); const [exporting, setExporting] = useState(false); const sheetRef = useRef(null);
  useEffect(() => { const request = batch ? idCardApi.getBatch(params.get("ids") || "") : idCardApi.getById(id); request.then((response) => { const data = response.data?.data || {}; setCards(data.idCards || (data.idCard ? [data.idCard] : [])); }).catch(() => toast.error("ID cards load nahi hue")).finally(() => setLoading(false)); }, [batch, id, params]);
  const downloadPdf = async () => { const sides = [...(sheetRef.current?.querySelectorAll("article") || [])]; if (!sides.length) return; try { setExporting(true); let pdf; for (let index = 0; index < sides.length; index += 1) { const card = cards[Math.floor(index / 2)]; const size = getTemplateSize(card?.templateSnapshot || card?.template || {}); const canvas = await html2canvas(sides[index], { scale: 3, useCORS: true, backgroundColor: null }); const orientation = size.widthMm >= size.heightMm ? "landscape" : "portrait"; if (!pdf) pdf = new jsPDF({ orientation, unit: "mm", format: [size.widthMm, size.heightMm] }); else pdf.addPage([size.widthMm, size.heightMm], orientation); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, size.widthMm, size.heightMm, undefined, "FAST"); } pdf.save(cards.length > 1 ? "student-id-cards.pdf" : `id-card-${cards[0]?.cardNumber || "student"}.pdf`); } catch { toast.error("PDF export failed"); } finally { setExporting(false); } };
  if (loading) return <div className={styles.loading}>Preparing print preview…</div>; if (!cards.length) return <div className={styles.loading}>ID card not found.</div>;
  return <div className={`page ${styles.printPage}`}><header className={`${styles.printHeader} no-print`}><div><ShieldCheck/><span><small>PRINT PRODUCTION</small><h1>{cards.length > 1 ? `${cards.length} Student ID Cards` : "Student ID Card Output"}</h1><p>Exact template dimensions · front and back · immutable issued snapshots.</p></span></div><div><Link to="/id-cards/generate">Back</Link><button type="button" onClick={downloadPdf} disabled={exporting}><Download/>{exporting ? "Creating PDF..." : "Save PDF"}</button><button type="button" onClick={() => window.print()}><Printer/>Print</button></div></header><div ref={sheetRef} className={styles.printSheet}>{cards.map((card) => <section className={styles.printCard} key={card._id}><div><span>FRONT</span><IdCardPreview idCard={card} side="front"/></div><div><span>BACK</span><IdCardPreview idCard={card} side="back"/></div></section>)}</div></div>;
};
export default PrintIdCard;

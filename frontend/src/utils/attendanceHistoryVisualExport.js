import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { formatAttendanceDate } from "./attendanceDate.js";

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const safeName = (value) => String(value || "attendance-history").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const border = { top: { style: "thin", color: { rgb: "D7E0EA" } }, bottom: { style: "thin", color: { rgb: "D7E0EA" } }, left: { style: "thin", color: { rgb: "D7E0EA" } }, right: { style: "thin", color: { rgb: "D7E0EA" } } };
const statusFill = { P: "E9F8EF", A: "FFF0F1", L: "FFF5E3", LT: "EDF6FF", S: "EAF4FF", H: "FFF7D6", "–": "F5F8FB" };
const statusFont = { P: "087A3D", A: "C1121B", L: "9A5A00", LT: "075EAE", S: "0868BD", H: "8A6100", "–": "728197" };

const excelStatus = (month, day, notes) => {
  const info = month.days?.find((item) => Number(item.day) === day);
  if (!info) return "";
  const marked = month.attendance?.[info.dateKey];
  if (marked) return marked;
  if (notes?.[info.dateKey]) return "H";
  if (info.isSunday) return "S";
  return "–";
};

export const exportAttendanceHistoryWorkbook = ({ months = [], dayNotes = {}, studentName, academyName, period }) => {
  const rows = [];
  const merges = [];
  const totalColumns = 40;
  const groups = [...months.reduce((map, month) => {
    const year = Number(month.year);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(month);
    return map;
  }, new Map())];
  rows.push([academyName || "KHILADI Academy"]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } });
  rows.push([`${studentName} Attendance History · ${period}`]);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalColumns - 1 } });
  rows.push([]);
  groups.forEach(([year, yearMonths]) => {
    const present = yearMonths.reduce((sum, month) => sum + Number(month.presentCount || 0), 0);
    const marked = yearMonths.reduce((sum, month) => sum + Number(month.presentCount || 0) + Number(month.absentCount || 0) + Number(month.leaveCount || 0) + Number(month.lateCount || 0), 0);
    rows.push([`${year} · ${yearMonths.length} active months · Attendance rate ${marked ? Math.round((present / marked) * 100) : 0}% · ${present}/${marked} days`]);
    merges.push({ s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: totalColumns - 1 } });
    rows.push(["Month", "Due Date", "Paid Date", "Fee Status", ...DAYS.map((day) => String(day).padStart(2, "0")), "Present", "Absent", "Leave", "Late", "%"]);
    yearMonths.forEach((month) => rows.push([
      month.fullLabel,
      formatAttendanceDate(month.importedDueDate, { fallback: "–", monthDate: month.days?.[0]?.dateKey || "" }),
      formatAttendanceDate(month.importedPaidDate, { fallback: "–", monthDate: month.days?.[0]?.dateKey || "" }),
      month.displayFeeStatus || month.importedFeeStatus || "Not added",
      ...DAYS.map((day) => excelStatus(month, day, dayNotes)),
      month.presentCount || 0, month.absentCount || 0, month.leaveCount || 0, month.lateCount || 0,
      `${month.attendancePercentage || 0}%`,
    ]));
    rows.push([]);
  });
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!merges"] = merges;
  sheet["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 15 }, ...DAYS.map(() => ({ wch: 4 })), ...Array.from({ length: 5 }, () => ({ wch: 10 }))];
  rows.forEach((row, r) => row.forEach((value, c) => {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (!cell) return;
    const isTitle = r <= 1;
    const isYear = typeof value === "string" && /^\d{4} ·/.test(value);
    const isHeader = value === "Month" || (r > 0 && rows[r]?.[0] === "Month");
    const status = c >= 4 && c <= 34 ? String(value || "") : "";
    cell.s = {
      border: isTitle || isYear ? undefined : border,
      alignment: { horizontal: isTitle || isYear ? "left" : "center", vertical: "center" },
      font: { bold: isTitle || isYear || isHeader, color: { rgb: statusFont[status] || (isTitle || isYear ? "FFFFFF" : "172A46") }, sz: isTitle ? (r === 0 ? 16 : 13) : 10 },
      fill: { patternType: "solid", fgColor: { rgb: statusFill[status] || (isTitle ? "CF0006" : isYear ? "172A46" : isHeader ? "EEF3F8" : "FFFFFF") } },
    };
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance History");
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true });
  saveAs(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${safeName(studentName)}-attendance-history.xlsx`);
};

export const exportAttendanceHistoryPdf = async ({ root, fileName, studentName, academyName, period }) => {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const sections = [...root.querySelectorAll("[data-attendance-year]")];
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3", compress: true });
  for (let index = 0; index < sections.length; index += 1) {
    if (index) pdf.addPage("a3", "landscape");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.setTextColor(14, 32, 59);
    pdf.text(`${studentName} Attendance History`, 10, 10);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(90, 105, 125);
    pdf.text(`${academyName} · ${period}`, 10, 15);
    const canvas = await html2canvas(sections[index], { scale: 1.5, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const pageWidth = pdf.internal.pageSize.getWidth() - 20;
    const pageHeight = pdf.internal.pageSize.getHeight() - 25;
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 10, 20, width, height, undefined, "FAST");
  }
  pdf.save(`${safeName(fileName)}.pdf`);
};

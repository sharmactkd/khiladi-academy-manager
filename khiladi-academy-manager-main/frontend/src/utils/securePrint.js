const createPrintWindow = (title) => {
  const printWindow = window.open("about:blank", "_blank", "width=1200,height=800");
  if (!printWindow) return null;

  const doc = printWindow.document;
  doc.title = title;
  doc.head.replaceChildren();
  doc.body.replaceChildren();

  const meta = doc.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob: http: https:; font-src data:;";
  doc.head.append(meta);
  return printWindow;
};

const finishPrint = (printWindow) => {
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const printDomElement = ({ element, title = "Print" }) => {
  const printWindow = createPrintWindow(title);
  if (!printWindow) return false;

  const doc = printWindow.document;
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    doc.head.append(node.cloneNode(true));
  });

  const style = doc.createElement("style");
  style.textContent = `
    @page { size: A4 landscape; margin: 10mm; }
    body { margin: 0; padding: 0; color: #111827; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    button, details, .no-print { display: none !important; }
  `;
  doc.head.append(style);
  doc.body.append(element.cloneNode(true));
  finishPrint(printWindow);
  return true;
};

export const printDataTable = ({ title, subtitle, columns, rows }) => {
  const printWindow = createPrintWindow(title);
  if (!printWindow) return false;
  const doc = printWindow.document;

  const style = doc.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    header { display:flex; justify-content:space-between; border-bottom:2px solid #111827; padding-bottom:10px; margin-bottom:20px; }
    h1 { margin:0; font-size:22px; } p { margin:4px 0 0; font-size:13px; color:#374151; }
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th, td { border:1px solid #d1d5db; padding:7px; text-align:left; vertical-align:top; }
    th { background:#f3f4f6; font-weight:700; } tr:nth-child(even) { background:#fafafa; }
    @page { size:A4 landscape; margin:12mm; }
  `;
  doc.head.append(style);

  const header = doc.createElement("header");
  const heading = doc.createElement("div");
  const h1 = doc.createElement("h1");
  h1.textContent = title;
  const sub = doc.createElement("p");
  sub.textContent = subtitle;
  heading.append(h1, sub);
  const meta = doc.createElement("div");
  const date = doc.createElement("p");
  date.textContent = `Date: ${new Date().toLocaleDateString("en-IN")}`;
  const count = doc.createElement("p");
  count.textContent = `Total Records: ${rows.length}`;
  meta.append(date, count);
  header.append(heading, meta);

  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  columns.forEach((column) => {
    const th = doc.createElement("th");
    th.textContent = column;
    headerRow.append(th);
  });
  thead.append(headerRow);
  const tbody = doc.createElement("tbody");
  rows.forEach((row) => {
    const tr = doc.createElement("tr");
    row.forEach((value) => {
      const td = doc.createElement("td");
      td.textContent = value == null ? "" : String(value);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  doc.body.append(header, table);
  finishPrint(printWindow);
  return true;
};

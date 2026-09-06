import clsx from "clsx";
import PageState from "./PageState.jsx";
import styles from "./DataTable.module.css";

const DataTable = ({ className = "", columns = [], emptyAction, emptyIcon, emptyTitle = "No records found", getRowKey = (row, index) => row?._id || index, loading = false, loadingTitle = "Loading…", onRowClick, rows = [], tableClassName = "", wrapClassName = "" }) => {
  if (loading) return <PageState className={className} loading title={loadingTitle} />;
  if (!rows.length) return <PageState action={emptyAction} className={className} icon={emptyIcon} title={emptyTitle} />;
  return <div className={clsx(styles.wrap, wrapClassName)}><table className={clsx(styles.table, tableClassName)}><thead><tr>{columns.map((column) => <th key={column.key} className={column.headerClassName}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={getRowKey(row, rowIndex)} onClick={() => onRowClick?.(row)}>{columns.map((column) => <td key={column.key} className={column.cellClassName} onClick={column.stopPropagation ? (event) => event.stopPropagation() : undefined}>{column.render ? column.render(row, rowIndex) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
};

export default DataTable;

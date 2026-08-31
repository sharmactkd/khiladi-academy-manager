import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Info,
  Layers3,
  LoaderCircle,
  Plus,
  Table2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import {
  getWorkbookSheetNames,
  parseStudentSheet,
  readStudentWorkbook,
  STUDENT_IMPORT_FIELDS,
} from "../../utils/studentExcelImport.js";
import styles from "./StudentImportModal.module.css";

const EMPTY_PARSED = {
  headers: [],
  rows: [],
  mappedRows: [],
  mapping: {},
  warnings: [],
};
const EMPTY_DESTINATION = {
  branchMode: "existing",
  branchId: "",
  newBranchName: "",
  batchMode: "existing",
  batchId: "",
  newBatchName: "",
};
const MAX_WORKBOOK_SIZE_MB = 60;
const MAX_WORKBOOK_SIZE_BYTES = MAX_WORKBOOK_SIZE_MB * 1024 * 1024;
const entityId = (value) => String(value?._id || value || "");
const formatBytes = (bytes = 0) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const StudentImportModal = ({
  open,
  onClose,
  onImport,
  branches = [],
  batches = [],
}) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [destination, setDestination] = useState(EMPTY_DESTINATION);
  const [parsed, setParsed] = useState(EMPTY_PARSED);

  const mappedFields = useMemo(
    () =>
      STUDENT_IMPORT_FIELDS.filter(({ key }) => {
        const value = parsed.mapping?.[key];
        return value !== "" && value !== null && value !== undefined;
      }),
    [parsed.mapping],
  );

  const filteredBatches = useMemo(() => {
    if (destination.branchMode === "new") return [];
    if (!destination.branchId) return batches;
    const linked = batches.filter(
      (batch) => entityId(batch.branch) === String(destination.branchId),
    );
    return linked.length || batches.some((batch) => entityId(batch.branch))
      ? linked
      : batches;
  }, [batches, destination.branchId, destination.branchMode]);

  useEffect(() => {
    if (!open) return;
    setDestination((current) => {
      if (!branches.length && current.branchMode === "existing")
        return {
          ...current,
          branchMode: "new",
          branchId: "",
          batchMode: "new",
          batchId: "",
        };
      if (current.branchMode !== "existing") return current;
      const valid = branches.some(
        (branch) => entityId(branch) === current.branchId,
      );
      const branchId =
        branches.length === 1
          ? entityId(branches[0])
          : valid
            ? current.branchId
            : "";
      return branchId === current.branchId
        ? current
        : { ...current, branchId, batchId: "" };
    });
  }, [branches, open]);

  useEffect(() => {
    if (!open) return;
    setDestination((current) => {
      if (current.branchMode === "new")
        return current.batchMode === "new"
          ? current
          : { ...current, batchMode: "new", batchId: "" };
      if (!filteredBatches.length && current.batchMode === "existing")
        return { ...current, batchMode: "new", batchId: "" };
      if (current.batchMode !== "existing") return current;
      const valid = filteredBatches.some(
        (batch) => entityId(batch) === current.batchId,
      );
      const batchId =
        filteredBatches.length === 1
          ? entityId(filteredBatches[0])
          : valid
            ? current.batchId
            : "";
      return batchId === current.batchId ? current : { ...current, batchId };
    });
  }, [filteredBatches, open]);

  if (!open) return null;

  const resetState = () => {
    setFileName("");
    setFileSize(0);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setLoadingFile(false);
    setImporting(false);
    setDragging(false);
    setDestination(EMPTY_DESTINATION);
    setParsed(EMPTY_PARSED);
  };
  const handleClose = () => {
    if (loadingFile || importing) return;
    resetState();
    onClose?.();
  };

  const chooseExistingBranch = () =>
    setDestination((current) => ({
      ...current,
      branchMode: "existing",
      newBranchName: "",
      branchId: branches.length === 1 ? entityId(branches[0]) : "",
      batchMode: "existing",
      batchId: "",
      newBatchName: "",
    }));
  const chooseNewBranch = () =>
    setDestination((current) => ({
      ...current,
      branchMode: "new",
      branchId: "",
      newBranchName: "",
      batchMode: "new",
      batchId: "",
      newBatchName: "",
    }));
  const chooseExistingBatch = () =>
    setDestination((current) => ({
      ...current,
      batchMode: "existing",
      newBatchName: "",
      batchId: filteredBatches.length === 1 ? entityId(filteredBatches[0]) : "",
    }));
  const chooseNewBatch = () =>
    setDestination((current) => ({
      ...current,
      batchMode: "new",
      batchId: "",
      newBatchName: "",
    }));

  const processFile = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name))
      return toast.error("Please upload .xlsx, .xls or .csv file");
    if (file.size > MAX_WORKBOOK_SIZE_BYTES)
      return toast.error(`Workbook cannot exceed ${MAX_WORKBOOK_SIZE_MB} MB`);
    try {
      flushSync(() => {
        setLoadingFile(true);
        setFileName(file.name);
        setFileSize(file.size);
        setWorkbook(null);
        setSheetNames([]);
        setSelectedSheet("");
        setParsed(EMPTY_PARSED);
      });
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const nextWorkbook = await readStudentWorkbook(file);
      const names = getWorkbookSheetNames(nextWorkbook);
      if (!names.length)
        throw new Error("Workbook me koi worksheet nahi mili.");
      const firstSheet = names[0];
      setWorkbook(nextWorkbook);
      setSheetNames(names);
      setSelectedSheet(firstSheet);
      setParsed(parseStudentSheet(nextWorkbook, firstSheet));
      toast.success(
        `${names.length} sheet${names.length === 1 ? "" : "s"} loaded`,
      );
    } catch (error) {
      const message = error?.message || "Invalid Excel file.";
      console.error("Student workbook import failed", error);
      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheet("");
      setParsed({ ...EMPTY_PARSED, warnings: [message] });
      toast.error(message);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSheetChange = (event) => {
    const sheet = event.target.value;
    flushSync(() => {
      setSelectedSheet(sheet);
      setLoadingFile(true);
    });
    window.setTimeout(() => {
      try {
        setParsed(parseStudentSheet(workbook, sheet));
      } catch (error) {
        setParsed({
          ...EMPTY_PARSED,
          warnings: [error?.message || "Sheet could not be parsed."],
        });
      } finally {
        setLoadingFile(false);
      }
    }, 50);
  };
  const handleMappingChange = (field, columnIndex) => {
    const mapping = { ...parsed.mapping, [field]: columnIndex };
    setParsed({
      ...parseStudentSheet(workbook, selectedSheet, mapping),
      mapping,
    });
  };
  const validateDestination = () => {
    if (destination.branchMode === "existing" && !destination.branchId) {
      toast.error("Please select a branch");
      return false;
    }
    if (destination.branchMode === "new" && !destination.newBranchName.trim()) {
      toast.error("New branch name required");
      return false;
    }
    if (destination.batchMode === "existing" && !destination.batchId) {
      toast.error("Please select a batch");
      return false;
    }
    if (destination.batchMode === "new" && !destination.newBatchName.trim()) {
      toast.error("New batch name required");
      return false;
    }
    return true;
  };
  const handleImport = async () => {
    if (!parsed.mappedRows.length)
      return toast.error("Import ke liye koi valid row nahi mili");
    if (!validateDestination()) return;
    try {
      setImporting(true);
      await onImport?.({
        students: parsed.mappedRows,
        destination,
        allowProvisional: true,
      });
      resetState();
      onClose?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Students import nahi ho paye",
      );
    } finally {
      setImporting(false);
    }
  };

  const destinationReady =
    (destination.branchMode === "existing"
      ? destination.branchId
      : destination.newBranchName.trim()) &&
    (destination.batchMode === "existing"
      ? destination.batchId
      : destination.newBatchName.trim());
  const importDisabled =
    loadingFile || importing || !parsed.mappedRows.length || !destinationReady;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-import-title"
      onMouseDown={(event) =>
        event.target === event.currentTarget && handleClose()
      }
    >
      <section className={styles.modal}>
        {loadingFile || importing ? (
          <div className={styles.blocker}>
            <LoaderCircle />
            <strong>
              {importing ? "Importing students…" : "Reading workbook…"}
            </strong>
          </div>
        ) : null}
        <header className={styles.header}>
          <span className={styles.headerIcon}>
            <Upload />
          </span>
          <div>
            <h2 id="student-import-title">Import Students from Excel</h2>
            <p>Upload, review and safely import student records.</p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={handleClose}
            disabled={loadingFile || importing}
            aria-label="Close"
          >
            <X />
          </button>
        </header>
        <div className={styles.body}>
          <section className={styles.step}>
            <div className={styles.stepTitle}>
              <b>01</b>
              <div>
                <h3>Import Destination</h3>
                <p>
                  Choose where the imported student profiles will be assigned.
                </p>
              </div>
            </div>
            <div className={styles.destinationRows}>
              <div className={styles.destinationRow}>
                <label>Branch</label>
                {destination.branchMode === "existing" ? (
                  <div className={styles.selectControl}>
                    <Building2 />
                    <select
                      value={destination.branchId}
                      onChange={(event) =>
                        setDestination((current) => ({
                          ...current,
                          branchId: event.target.value,
                          batchId: "",
                        }))
                      }
                      disabled={
                        branches.length === 1 || loadingFile || importing
                      }
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={entityId(branch)} value={entityId(branch)}>
                          {branch.branchName}
                          {branch.branchCode ? ` (${branch.branchCode})` : ""}
                        </option>
                      ))}
                    </select>
                    {branches.length === 1 ? (
                      <span>Auto-selected</span>
                    ) : (
                      <ChevronDown />
                    )}
                  </div>
                ) : (
                  <div className={styles.newControl}>
                    <Building2 />
                    <input
                      autoFocus
                      value={destination.newBranchName}
                      onChange={(event) =>
                        setDestination((current) => ({
                          ...current,
                          newBranchName: event.target.value,
                        }))
                      }
                      placeholder="Enter new branch name"
                      maxLength={120}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={
                    destination.branchMode === "existing"
                      ? chooseNewBranch
                      : chooseExistingBranch
                  }
                  disabled={
                    !branches.length && destination.branchMode === "new"
                  }
                >
                  <Plus />
                  {destination.branchMode === "existing"
                    ? "Add New Branch"
                    : "Use Existing Branch"}
                </button>
              </div>
              <div className={styles.destinationRow}>
                <label>Batch</label>
                {destination.batchMode === "existing" ? (
                  <div className={styles.selectControl}>
                    <Layers3 />
                    <select
                      value={destination.batchId}
                      onChange={(event) =>
                        setDestination((current) => ({
                          ...current,
                          batchId: event.target.value,
                        }))
                      }
                      disabled={
                        filteredBatches.length === 1 || loadingFile || importing
                      }
                    >
                      <option value="">Select Batch</option>
                      {filteredBatches.map((batch) => (
                        <option key={entityId(batch)} value={entityId(batch)}>
                          {batch.batchName}
                          {batch.martialArt ? ` · ${batch.martialArt}` : ""}
                        </option>
                      ))}
                    </select>
                    {filteredBatches.length === 1 ? (
                      <span>Auto-selected</span>
                    ) : (
                      <ChevronDown />
                    )}
                  </div>
                ) : (
                  <div className={styles.newControl}>
                    <Layers3 />
                    <input
                      value={destination.newBatchName}
                      onChange={(event) =>
                        setDestination((current) => ({
                          ...current,
                          newBatchName: event.target.value,
                        }))
                      }
                      placeholder="Enter new batch name"
                      maxLength={120}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={
                    destination.batchMode === "existing"
                      ? chooseNewBatch
                      : chooseExistingBatch
                  }
                  disabled={
                    !filteredBatches.length && destination.batchMode === "new"
                  }
                >
                  <Plus />
                  {destination.batchMode === "existing"
                    ? "Add New Batch"
                    : "Use Existing Batch"}
                </button>
              </div>
            </div>
            <div className={styles.helper}>
              <Info />
              <span>
                {branches.length > 1 || filteredBatches.length > 1
                  ? "Select the required branch and batch from the available dropdowns."
                  : "The only available branch and batch have been selected automatically."}
              </span>
            </div>
          </section>
          <section className={styles.step}>
            <div className={styles.stepTitle}>
              <b>02</b>
              <div>
                <h3>Workbook</h3>
                <p>Select the Excel or CSV source and verify its worksheet.</p>
              </div>
            </div>
            <div className={styles.workbookGrid}>
              <div
                className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
                role="button"
                tabIndex={loadingFile || importing ? -1 : 0}
                aria-label="Choose or drop an Excel file"
                onClick={() => {
                  if (!loadingFile && !importing) fileInputRef.current?.click();
                }}
                onKeyDown={(event) => {
                  if (
                    !loadingFile &&
                    !importing &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDragging(false);
                  processFile(event.dataTransfer.files?.[0]);
                }}
              >
                <FileSpreadsheet className={styles.excelIcon} />
                <div>
                  <strong>
                    Drop Excel file here or <span>browse</span>
                  </strong>
                  <small>
                    .xlsx, .xls, .csv · Maximum {MAX_WORKBOOK_SIZE_MB} MB
                  </small>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.currentTarget.value = "";
                  }}
                  onChange={(event) => processFile(event.target.files?.[0])}
                  disabled={loadingFile || importing}
                />
                {fileName ? (
                  <div
                    className={`${styles.fileChip} ${workbook ? styles.fileReady : styles.fileError}`}
                  >
                    <FileSpreadsheet />
                    <span>
                      <strong>{fileName}</strong>
                      <small>{formatBytes(fileSize)}</small>
                    </span>
                    {workbook ? <CheckCircle2 /> : <AlertTriangle />}
                  </div>
                ) : null}
              </div>
              <div className={styles.sheetPanel}>
                <label>Sheet</label>
                <div className={styles.sheetSelect}>
                  <Table2 />
                  <select
                    value={selectedSheet}
                    onChange={handleSheetChange}
                    disabled={!sheetNames.length || loadingFile || importing}
                  >
                    <option value="">No sheet selected</option>
                    {sheetNames.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                        {sheet === selectedSheet && parsed.rows.length
                          ? ` (${parsed.rows.length} rows)`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
                {workbook ? (
                  <p className={styles.ready}>
                    <CheckCircle2 />
                    Workbook ready
                  </p>
                ) : (
                  <p className={styles.pending}>
                    <Info />
                    Choose a workbook to continue
                  </p>
                )}
              </div>
            </div>
            {parsed.warnings.length ? (
              <div className={styles.warning}>
                {parsed.warnings.map((warning) => (
                  <span key={warning}>
                    <AlertTriangle />
                    {warning}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
          {parsed.headers.length ? (
            <section className={styles.step}>
              <div className={styles.mappingHeader}>
                <div className={styles.stepTitle}>
                  <b>03</b>
                  <div>
                    <h3>Column Mapping</h3>
                    <p>Review how Excel columns connect to student fields.</p>
                  </div>
                </div>
                <div className={styles.summary}>
                  <span>
                    <Table2 />
                    {parsed.headers.length} columns detected
                  </span>
                  <span>
                    <CheckCircle2 />
                    {mappedFields.length} auto-mapped
                  </span>
                  <span>
                    <UsersRound />
                    {parsed.mappedRows.length} rows ready
                  </span>
                </div>
              </div>
              <div className={styles.fullMappings}>
                <div className={styles.mappingTableHeader}>
                  <span>App Field</span>
                  <span>Excel Column</span>
                </div>
                {STUDENT_IMPORT_FIELDS.map((field) => {
                  const mappingValue = parsed.mapping[field.key];
                  const unmapped =
                    mappingValue === undefined ||
                    mappingValue === null ||
                    mappingValue === "";
                  return (
                    <label
                      key={field.key}
                      className={unmapped ? styles.unmapped : ""}
                    >
                      <strong>
                        {field.label}
                        
                      </strong>
                      <select
                        value={mappingValue ?? ""}
                        onChange={(event) =>
                          handleMappingChange(field.key, event.target.value)
                        }
                        disabled={loadingFile || importing}
                      >
                        <option value="">Not Mapped</option>
                        {parsed.headers.map((header, index) => (
                          <option
                            key={field.key + "-" + index}
                            value={String(index)}
                          >
                            {header || "Unnamed Column"}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
              <div className={styles.safety}>
                <AlertTriangle />
                <span>No data will be saved until you confirm import.</span>
              </div>
            </section>
          ) : null}
        </div>
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancel}
            onClick={handleClose}
            disabled={loadingFile || importing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.importButton}
            onClick={handleImport}
            disabled={importDisabled}
          >
            <Upload />
            {importing
              ? "Importing…"
              : `Import ${parsed.mappedRows.length || ""} Student${parsed.mappedRows.length === 1 ? "" : "s"}`}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default StudentImportModal;

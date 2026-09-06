import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Users,
  UserRound,
  Building2,
  Layers3,
} from "lucide-react";
import studentApi from "../../api/studentApi.js";
import WhatsAppReminderSettings from "../attendance/WhatsAppReminderSettings.jsx";
import { desktopReminderUrl } from "../attendance/whatsappReminder.js";
import useWhatsAppSettings from "./useWhatsAppSettings.js";
import {
  addDays,
  announcementTemplates,
  buildCampaign,
  buildStudentMessage,
  formatMessageDate,
  studentName,
  todayISO,
} from "./whatsappCampaign.js";
import { validateGroupLink } from "./whatsappGroup.js";
import styles from "./WhatsAppWorkspace.module.css";

const AUDIENCES = [
  { id: "student", label: "Student", icon: UserRound },
  { id: "branch", label: "Branch", icon: Building2 },
  { id: "batch", label: "Batch", icon: Layers3 },
];

const TEMPLATE_TYPES = [
  { id: "holiday", label: "Holiday" },
  { id: "belt", label: "Belt Test" },
  { id: "championship", label: "Championship" },
  { id: "sickness", label: "Sickness / Health" },
  { id: "custom", label: "Custom" },
];

const makeHolidayDefaults = () => {
  const from = todayISO();
  return {
    from,
    to: from,
    days: 1,
    reason: "holiday",
    resume: addDays(from, 2),
  };
};

const makeDefaults = (type) => {
  const today = todayISO();
  if (type === "holiday") return makeHolidayDefaults();
  if (type === "belt") return { date: today, venue: "", time: "", requirements: "" };
  if (type === "championship") return { event: "", date: today, venue: "", time: "", deadline: today };
  if (type === "sickness") return { from: today, to: today, status: "paused", details: "" };
  return { body: "" };
};

const groupKey = (kind, id) => `${kind}:${id}`;

export default function WhatsAppWorkspace({ user, branches = [], batches = [] }) {
  const settings = useWhatsAppSettings(user);
  return (
    <Workspace
      key={settings.key}
      settings={settings}
      branches={branches}
      batches={batches}
    />
  );
}

function Workspace({ settings, branches, batches }) {
  const [audience, setAudience] = useState("student");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selectionMode, setSelectionMode] = useState("allActive");
  const [selected, setSelected] = useState(new Set());
  const [branchFilter, setBranchFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [templateType, setTemplateType] = useState("holiday");
  const [templateValues, setTemplateValues] = useState(makeDefaults("holiday"));
  const [message, setMessage] = useState("");
  const [messageTouched, setMessageTouched] = useState(false);
  const [review, setReview] = useState(null);
  const [opened, setOpened] = useState(new Set());
  const [done, setDone] = useState(new Set());
  const [groupId, setGroupId] = useState("");
  const [groupChoice, setGroupChoice] = useState("saved");
  const [otherGroupName, setOtherGroupName] = useState("");
  const [otherGroupLink, setOtherGroupLink] = useState("");
  const [groupPreview, setGroupPreview] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const all = [];
        let page = 1;
        let hasNext = true;
        while (hasNext && !cancelled) {
          const response = await studentApi.getAll({ paginated: true, page, limit: 100 });
          const data = response.data;
          if (!Array.isArray(data?.students) || !data.pagination) {
            throw new Error("Unexpected student response. Please retry.");
          }
          all.push(...data.students);
          hasNext = Boolean(data.pagination.hasNextPage);
          page += 1;
        }
        if (!cancelled) {
          setStudents(
            [...new Map(all.map((student) => [String(student._id), student])).values()].sort(
              (a, b) => studentName(a).localeCompare(studentName(b)),
            ),
          );
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError?.response?.data?.message || requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch?.isActive !== false),
    [branches],
  );
  const activeBatches = useMemo(
    () => batches.filter((batch) => batch?.isActive !== false),
    [batches],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      if (status !== "all" && student.status !== status) return false;
      if (branchFilter && String(student.branch?._id || student.branch) !== branchFilter) return false;
      if (batchFilter && String(student.batch?._id || student.batch) !== batchFilter) return false;
      if (!query) return true;
      return `${studentName(student)} ${student.phone || ""} ${student.admissionNumber || ""} ${student.batch?.batchName || ""} ${student.branch?.branchName || ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [students, status, branchFilter, batchFilter, search]);

  const currentStudentCount = selected.size;

  const groupTargets = useMemo(() => {
    if (audience === "branch") {
      return activeBranches.map((branch) => ({
        id: groupKey("branch", branch._id),
        entityId: String(branch._id),
        label: branch.branchName || "Unnamed Branch",
        type: "Branch",
        link: branch.whatsappGroupLink || "",
      }));
    }
    if (audience === "batch") {
      return activeBatches.map((batch) => ({
        id: groupKey("batch", batch._id),
        entityId: String(batch._id),
        label: batch.batchName || "Unnamed Batch",
        type: "Batch",
        link: batch.whatsappGroupLink || "",
        branchName: batch.branch?.branchName || "",
      }));
    }
    return [];
  }, [audience, activeBranches, activeBatches]);

  const selectedGroup = groupTargets.find((target) => target.id === groupId) || null;
  const savedGroupLink = selectedGroup?.link || "";
  const effectiveGroupName = groupChoice === "saved"
    ? selectedGroup?.label || ""
    : otherGroupName.trim();
  const effectiveGroupLink = groupChoice === "saved" ? savedGroupLink : otherGroupLink.trim();

  const generatedMessage = useMemo(() => {
    const academyName = settings.value.academyName || "Academy";
    if (templateType === "holiday") {
      return buildStudentMessage(
        announcementTemplates.holiday,
        {
          ...templateValues,
          from: formatMessageDate(templateValues.from),
          to: formatMessageDate(templateValues.to),
          resume: formatMessageDate(templateValues.resume),
        },
        academyName,
      );
    }
    return buildStudentMessage(
      announcementTemplates[templateType],
      {
        ...templateValues,
        date: formatMessageDate(templateValues.date),
        deadline: formatMessageDate(templateValues.deadline),
        from: formatMessageDate(templateValues.from),
        to: formatMessageDate(templateValues.to),
      },
      academyName,
    );
  }, [templateType, templateValues, settings.value.academyName]);

  useEffect(() => {
    if (!messageTouched) setMessage(generatedMessage);
  }, [generatedMessage, messageTouched]);

  const resetTemplate = (nextType) => {
    setTemplateType(nextType);
    setTemplateValues(makeDefaults(nextType));
    setMessageTouched(false);
    setReview(null);
  };

  const updateTemplateValue = (key, value) => {
    setTemplateValues((previous) => {
      const next = { ...previous, [key]: value };
      if (templateType === "holiday" && (key === "from" || key === "days")) {
        const from = key === "from" ? value : previous.from;
        const days = key === "days" ? Math.max(1, Number(value || 1)) : Math.max(1, Number(previous.days || 1));
        next.days = days;
        next.to = addDays(from, days);
        next.resume = addDays(from, days + 1);
      }
      if (templateType === "holiday" && key === "to") {
        const fromDate = new Date(`${previous.from}T00:00:00`);
        const toDate = new Date(`${value}T00:00:00`);
        const calculated = Math.max(1, Math.floor((toDate - fromDate) / 86400000) + 1);
        next.days = calculated;
        next.resume = addDays(value, 2);
      }
      setMessageTouched(false);
      return next;
    });
    setReview(null);
  };

  const toggleStudent = (id) => {
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setReview(null);
  };

  const applySelectionMode = (mode) => {
    setSelectionMode(mode);
    setReview(null);
    if (mode === "allActive") {
      setSelected(new Set(students.filter((student) => student.status === "active").map((student) => String(student._id))));
    } else if (mode === "selectedVisible") {
      setSelected(new Set(filteredStudents.map((student) => String(student._id))));
    } else if (mode === "branch" && branchFilter) {
      setSelected(new Set(students.filter((student) => String(student.branch?._id || student.branch) === branchFilter && student.status === "active").map((student) => String(student._id))));
    } else if (mode === "batch" && batchFilter) {
      setSelected(new Set(students.filter((student) => String(student.batch?._id || student.batch) === batchFilter && student.status === "active").map((student) => String(student._id))));
    }
  };

  const prepareStudentReview = () => {
    try {
      const campaign = buildCampaign(students, selected, message, settings.value);
      setReview(campaign);
      setOpened(new Set());
      setDone(new Set());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openStudentChat = (recipient) => {
    setOpened((previous) => new Set([...previous, recipient.phone]));
    window.location.href = desktopReminderUrl(recipient.url);
  };

  const buildGroupMessage = () => {
    if (!effectiveGroupName) throw new Error("Select a saved group or enter another group name.");
    const validLink = validateGroupLink(effectiveGroupLink);
    if (!validLink) throw new Error("Add a valid WhatsApp group invite link for the selected destination.");
    const groupMessage = buildStudentMessage(
      message,
      { name: "everyone", group: effectiveGroupName },
      settings.value.academyName || "Academy",
    );
    if (groupMessage.length > 3500) throw new Error("Please keep the group message under 3500 characters.");
    return { name: effectiveGroupName, link: validLink, message: groupMessage };
  };

  const reviewGroup = () => {
    try {
      setGroupPreview(buildGroupMessage());
      setNotice("");
    } catch (requestError) {
      setGroupPreview(null);
      setNotice(requestError.message);
    }
  };

  const copyGroupMessage = async () => {
    if (!groupPreview) return;
    try {
      await navigator.clipboard.writeText(groupPreview.message);
      setNotice("Message copied. Open the selected WhatsApp group, paste and press Send.");
    } catch {
      setNotice("Clipboard permission unavailable. Copy the preview manually.");
    }
  };

  const handleAudienceChange = (nextAudience) => {
    setAudience(nextAudience);
    setReview(null);
    setGroupPreview(null);
    setNotice("");
    setGroupId("");
    setGroupChoice("saved");
    setOtherGroupName("");
    setOtherGroupLink("");
  };

  return (
    <section className={styles.workspace}>
      <header className={styles.workspaceHeader}>
        <div>
          <div className={styles.eyebrow}>WhatsApp Workspace</div>
          <h2>Send the right message to the right audience</h2>
          <p>Choose students, a branch group, or a batch group. Review every message before it opens in WhatsApp.</p>
        </div>
        <div className={styles.headerStat}><Users size={17} /><strong>{students.length}</strong><span>students loaded</span></div>
      </header>

      <div className={styles.notice}>
        <MessageCircle size={17} />
        <span><strong>Assisted sending:</strong> this page prepares the message and opens WhatsApp. You still verify the destination and press <b>Send</b> in WhatsApp.</span>
      </div>

      <div className={styles.audienceTabs} role="tablist" aria-label="WhatsApp audience">
        {AUDIENCES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={audience === id} className={audience === id ? styles.audienceActive : ""} onClick={() => handleAudienceChange(id)}>
            <Icon size={17} /><span>{label}</span>
            {id === "student" ? <small>{students.length}</small> : id === "branch" ? <small>{activeBranches.length}</small> : <small>{activeBatches.length}</small>}
          </button>
        ))}
      </div>

      <WhatsAppReminderSettings key={JSON.stringify(settings.value)} value={settings.value} onSave={settings.save} />

      {audience === "student" ? (
        <>
          <div className={styles.columns}>
            <section className={styles.card}>
              <div className={styles.cardHeader}><div><span className={styles.step}>01</span><div><h3>Choose students</h3><p>Select by audience type or tick individual students.</p></div></div><strong className={styles.countBadge}>{currentStudentCount} selected</strong></div>
              <div className={styles.selectionTabs}>
                <button type="button" className={selectionMode === "allActive" ? styles.selectedSubtab : ""} onClick={() => applySelectionMode("allActive")}>All Active</button>
                <button type="button" className={selectionMode === "branch" ? styles.selectedSubtab : ""} onClick={() => applySelectionMode("branch")}>By Branch</button>
                <button type="button" className={selectionMode === "batch" ? styles.selectedSubtab : ""} onClick={() => applySelectionMode("batch")}>By Batch</button>
                <button type="button" className={selectionMode === "selectedVisible" ? styles.selectedSubtab : ""} onClick={() => applySelectionMode("selectedVisible")}>Selected / Visible</button>
              </div>

              <div className={styles.filterGrid}>
                <label><span>Search student</span><div className={styles.inputIcon}><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone or admission no." /></div></label>
                <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All</option></select></label>
                <label><span>Branch</span><select value={branchFilter} onChange={(event) => { setBranchFilter(event.target.value); setSelectionMode("branch"); }}><option value="">All branches</option>{activeBranches.map((branch) => <option key={branch._id} value={branch._id}>{branch.branchName}</option>)}</select></label>
                <label><span>Batch</span><select value={batchFilter} onChange={(event) => { setBatchFilter(event.target.value); setSelectionMode("batch"); }}><option value="">All batches</option>{activeBatches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}</select></label>
              </div>

              <div className={styles.selectionActions}><button type="button" onClick={() => setSelected(new Set(filteredStudents.map((student) => String(student._id))))}>Select visible</button><button type="button" onClick={() => setSelected(new Set())}>Clear</button><span>{filteredStudents.length} matching</span></div>

              {loading ? <div className={styles.loading}><RefreshCw size={22} />Loading students…</div> : error && !students.length ? <div className={styles.error}>{error}<button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div> : <div className={styles.students}>{filteredStudents.map((student) => { const id = String(student._id); return <label className={styles.student} key={id}><input type="checkbox" checked={selected.has(id)} onChange={() => toggleStudent(id)} /><span className={styles.avatar}>{studentName(student).slice(0, 1).toUpperCase()}</span><span className={styles.studentInfo}><strong>{studentName(student)}</strong><small>{student.phone || "No phone"} · {student.batch?.batchName || "No batch"} · {student.branch?.branchName || "No branch"}</small></span><span className={student.status === "active" ? styles.activePill : styles.inactivePill}>{student.status || "unknown"}</span></label>; })}{!filteredStudents.length ? <div className={styles.empty}>No students match these filters.</div> : null}</div>}
            </section>

            <AnnouncementComposer type={templateType} values={templateValues} message={message} onTypeChange={resetTemplate} onValueChange={updateTemplateValue} onMessageChange={(value) => { setMessage(value); setMessageTouched(true); setReview(null); }} />
          </div>

          {error && students.length ? <div className={styles.error}>{error}</div> : null}

          {!review ? <div className={styles.reviewBar}><div><Send size={17} /><span><strong>Ready to review</strong><small>{currentStudentCount ? `${currentStudentCount} students selected` : "Select at least one student"}</small></span></div><button type="button" className={styles.primary} disabled={!currentStudentCount} onClick={prepareStudentReview}>Review &amp; Prepare WhatsApp</button></div> : <StudentReview review={review} opened={opened} done={done} setDone={setDone} onBack={() => setReview(null)} onOpen={openStudentChat} />}
        </>
      ) : (
        <GroupComposer
          audience={audience}
          groupTargets={groupTargets}
          groupId={groupId}
          setGroupId={(value) => { setGroupId(value); setGroupPreview(null); setNotice(""); }}
          selectedGroup={selectedGroup}
          groupChoice={groupChoice}
          setGroupChoice={(value) => { setGroupChoice(value); setGroupPreview(null); }}
          otherGroupName={otherGroupName}
          setOtherGroupName={(value) => { setOtherGroupName(value); setGroupPreview(null); }}
          otherGroupLink={otherGroupLink}
          setOtherGroupLink={(value) => { setOtherGroupLink(value); setGroupPreview(null); }}
          type={templateType}
          values={templateValues}
          message={message}
          onTypeChange={resetTemplate}
          onValueChange={updateTemplateValue}
          onMessageChange={(value) => { setMessage(value); setMessageTouched(true); setGroupPreview(null); }}
          preview={groupPreview}
          notice={notice}
          onReview={reviewGroup}
          onCopy={copyGroupMessage}
        />
      )}
    </section>
  );
}

function AnnouncementComposer({ type, values, message, onTypeChange, onValueChange, onMessageChange }) {
  return <section className={styles.card}>
    <div className={styles.cardHeader}><div><span className={styles.step}>02</span><div><h3>Prepare message</h3><p>Prefilled fields generate the message automatically.</p></div></div><CalendarDays size={19} /></div>
    <div className={styles.templateTabs}>{TEMPLATE_TYPES.map((item) => <button key={item.id} type="button" className={type === item.id ? styles.templateActive : ""} onClick={() => onTypeChange(item.id)}>{item.label}</button>)}</div>
    <TemplateFields type={type} values={values} onValueChange={onValueChange} />
    <label className={styles.messageField}><span>Final WhatsApp message</span><textarea value={message} onChange={(event) => onMessageChange(event.target.value)} maxLength={3500} rows={11} /></label>
    <div className={styles.helper}><ChevronDown size={14} /> Student messages replace <code>{"{name}"}</code> automatically. You can edit the final message before review.</div>
  </section>;
}

function GroupComposer(props) {
  const { audience, groupTargets, groupId, setGroupId, selectedGroup, groupChoice, setGroupChoice, otherGroupName, setOtherGroupName, otherGroupLink, setOtherGroupLink, type, values, message, onTypeChange, onValueChange, onMessageChange, preview, notice, onReview, onCopy } = props;
  return <div className={styles.groupLayout}>
    <section className={styles.card}>
      <div className={styles.cardHeader}><div><span className={styles.step}>01</span><div><h3>Choose {audience} group</h3><p>Use the group saved in the {audience} profile or enter another destination.</p></div></div><MessageCircle size={19} /></div>
      <label><span>Destination</span><select value={groupId} onChange={(event) => setGroupId(event.target.value)}><option value="">Select {audience}</option>{groupTargets.map((target) => <option key={target.id} value={target.id}>{target.label}{target.branchName ? ` · ${target.branchName}` : ""}</option>)}</select></label>
      {!groupTargets.length ? <div className={styles.empty}>No active {audience}s are available.</div> : null}
      {selectedGroup ? <div className={styles.savedGroup}><div className={styles.groupIcon}><MessageCircle size={17} /></div><div><strong>{selectedGroup.label}</strong><small>{selectedGroup.type}{selectedGroup.branchName ? ` · ${selectedGroup.branchName}` : ""}</small><span>{selectedGroup.link ? "Saved WhatsApp group link available" : "No saved group link"}</span></div></div> : null}

      <div className={styles.destinationChoices}>
        <label className={styles.radioCard}><input type="radio" checked={groupChoice === "saved"} disabled={!savedLink(selectedGroup)} onChange={() => setGroupChoice("saved")} /><span><strong>Use saved group</strong><small>{selectedGroup?.link ? "Use the link already stored in this profile." : "No saved link for this profile."}</small></span></label>
        <label className={styles.radioCard}><input type="radio" checked={groupChoice === "other"} onChange={() => setGroupChoice("other")} /><span><strong>Use another group</strong><small>Enter a different group name and invite link.</small></span></label>
      </div>
      {groupChoice === "other" ? <div className={styles.filterGrid}><label><span>Other group name</span><input value={otherGroupName} onChange={(event) => setOtherGroupName(event.target.value)} placeholder="e.g. Sunday Batch Parents" /></label><label><span>WhatsApp group link</span><input value={otherGroupLink} onChange={(event) => setOtherGroupLink(event.target.value)} placeholder="https://chat.whatsapp.com/..." /></label></div> : null}
      <div className={styles.linkRow}>{selectedGroup?.link ? <a href={selectedGroup.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Open saved group link</a> : null}</div>
    </section>
    <AnnouncementComposer type={type} values={values} message={message} onTypeChange={onTypeChange} onValueChange={onValueChange} onMessageChange={onMessageChange} />
    <section className={styles.card}>
      <div className={styles.cardHeader}><div><span className={styles.step}>03</span><div><h3>Review group message</h3><p>Copy the message, open the correct group, paste and send.</p></div></div><Check size={19} /></div>
      <button type="button" className={styles.primary} onClick={onReview}>Review Group Message</button>
      {notice ? <div className={styles.error}>{notice}</div> : null}
      {preview ? <div className={styles.groupPreview}><div className={styles.previewDestination}><MessageCircle size={17} /><span><small>Destination</small><strong>{preview.name}</strong></span></div><pre>{preview.message}</pre><div className={styles.actions}><button type="button" onClick={onCopy}><Copy size={15} /> Copy Message</button><a href={preview.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Open Group</a><a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer">WhatsApp Web</a></div><p>Opening the group does not send anything automatically. Verify the group before pressing Send.</p></div> : null}
    </section>
  </div>;
}

function savedLink(target) { return Boolean(target?.link); }

function TemplateFields({ type, values, onValueChange }) {
  if (type === "holiday") return <div className={styles.formGrid}>
    <Field label="Holiday From" type="date" value={values.from} onChange={(value) => onValueChange("from", value)} />
    <Field label="Holiday To" type="date" value={values.to} onChange={(value) => onValueChange("to", value)} />
    <Field label="Number of Days" type="number" min="1" value={values.days} onChange={(value) => onValueChange("days", value)} />
    <Field label="Reason" value={values.reason} onChange={(value) => onValueChange("reason", value)} placeholder="Festival / academy holiday" />
    <Field label="Classes Resume On" type="date" value={values.resume} onChange={(value) => onValueChange("resume", value)} />
  </div>;
  if (type === "belt") return <div className={styles.formGrid}><Field label="Test Date" type="date" value={values.date} onChange={(value) => onValueChange("date", value)} /><Field label="Venue" value={values.venue} onChange={(value) => onValueChange("venue", value)} placeholder="Academy / test venue" /><Field label="Reporting Time" value={values.time} onChange={(value) => onValueChange("time", value)} placeholder="e.g. 8:30 AM" /><Field label="Requirements" value={values.requirements} onChange={(value) => onValueChange("requirements", value)} placeholder="Dobok, belt, water bottle…" /></div>;
  if (type === "championship") return <div className={styles.formGrid}><Field label="Event Name" value={values.event} onChange={(value) => onValueChange("event", value)} placeholder="Championship name" /><Field label="Event Date" type="date" value={values.date} onChange={(value) => onValueChange("date", value)} /><Field label="Venue" value={values.venue} onChange={(value) => onValueChange("venue", value)} /><Field label="Reporting Time" value={values.time} onChange={(value) => onValueChange("time", value)} /><Field label="Confirmation Deadline" type="date" value={values.deadline} onChange={(value) => onValueChange("deadline", value)} /></div>;
  if (type === "sickness") return <div className={styles.formGrid}><Field label="From" type="date" value={values.from} onChange={(value) => onValueChange("from", value)} /><Field label="To" type="date" value={values.to} onChange={(value) => onValueChange("to", value)} /><label><span>Status</span><select value={values.status} onChange={(event) => onValueChange("status", event.target.value)}><option value="paused">paused</option><option value="closed">closed</option><option value="rescheduled">rescheduled</option></select></label><Field label="Reason / Health Note" value={values.details} onChange={(value) => onValueChange("details", value)} placeholder="Short, appropriate note" /></div>;
  return <label className={styles.messageField}><span>Your message</span><textarea value={values.body} onChange={(event) => onValueChange("body", event.target.value)} rows={5} placeholder="Write your announcement…" /></label>;
}

function Field({ label, type = "text", value, onChange, placeholder, min }) { return <label><span>{label}</span><input type={type} min={min} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>; }

function StudentReview({ review, opened, done, setDone, onBack, onOpen }) {
  return <section className={styles.card}><div className={styles.cardHeader}><div><span className={styles.step}>03</span><div><h3>Review &amp; send · {review.recipients.length} chats</h3><p>Each chat must still be sent manually in WhatsApp.</p></div></div><button type="button" onClick={onBack}>Back to edit</button></div>{review.invalid.length ? <div className={styles.error}>Missing/invalid phone: {review.invalid.map((item) => item.name).join(", ")}</div> : null}{review.recipients.map((recipient) => <article className={styles.recipient} key={recipient.phone}><div><h4>{recipient.names.join(", ")}</h4><small>+{recipient.phone} · {done.has(recipient.phone) ? "Done" : opened.has(recipient.phone) ? "Opened" : "Not opened"}</small></div><details><summary>Preview exact message</summary><pre>{recipient.message}</pre></details><div className={styles.actions}><button type="button" onClick={() => onOpen(recipient)}>{opened.has(recipient.phone) ? "Reopen WhatsApp" : "Open WhatsApp"}</button><a href={recipient.url} target="_blank" rel="noopener noreferrer" onClick={() => {}}><ExternalLink size={14} /> Browser fallback</a><label className={styles.doneCheck}><input type="checkbox" disabled={!opened.has(recipient.phone)} checked={done.has(recipient.phone)} onChange={() => setDone((previous) => { const next = new Set(previous); next.has(recipient.phone) ? next.delete(recipient.phone) : next.add(recipient.phone); return next; })} /> I finished this chat</label></div></article>)}</section>;
}

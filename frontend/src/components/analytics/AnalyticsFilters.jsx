import { CalendarRange, MapPin, RefreshCw, RotateCcw } from "lucide-react";
import { getDateRange } from "../../pages/analytics/analyticsStudio.utils.js";

const AnalyticsFilters = ({ branches, filters, loading, onChange, onRefresh }) => {
  const patch = (values) => onChange((current) => ({ ...current, ...values }));
  const choosePreset = (preset) => patch({ preset, ...getDateRange(preset) });
  const reset = () => onChange({ branch: "", fromDate: "", toDate: "", preset: "all" });

  return (
    <section className="analytics-studio__filters" aria-label="Analytics filters">
      <div className="analytics-studio__filter-heading">
        <span><CalendarRange size={18} /></span>
        <div><strong>Analytics scope</strong><small>Filter every insight from one place</small></div>
      </div>
      <div className="analytics-studio__presets" aria-label="Date presets">
        {[{ id: "30d", label: "30 Days" }, { id: "90d", label: "90 Days" }, { id: "year", label: "This Year" }, { id: "all", label: "All Time" }].map((item) => (
          <button type="button" key={item.id} className={filters.preset === item.id ? "is-active" : ""} onClick={() => choosePreset(item.id)}>{item.label}</button>
        ))}
      </div>
      <label className="analytics-studio__field"><span><MapPin size={14} />Branch</span><select value={filters.branch} onChange={(event) => patch({ branch: event.target.value })}><option value="">All branches</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.branchName || branch.name}</option>)}</select></label>
      <label className="analytics-studio__field"><span>From date</span><input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => patch({ fromDate: event.target.value, preset: "custom" })} /></label>
      <label className="analytics-studio__field"><span>To date</span><input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => patch({ toDate: event.target.value, preset: "custom" })} /></label>
      <div className="analytics-studio__filter-actions"><button type="button" title="Reset filters" onClick={reset}><RotateCcw size={16} /></button><button type="button" className="is-primary" onClick={onRefresh} disabled={loading}><RefreshCw size={16} className={loading ? "is-spinning" : ""} />Refresh</button></div>
    </section>
  );
};

export default AnalyticsFilters;

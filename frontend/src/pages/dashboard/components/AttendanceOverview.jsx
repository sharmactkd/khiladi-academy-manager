import { Link } from "react-router-dom";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck2, ChevronRight } from "lucide-react";

const AttendanceOverview = ({ data, dashboard, lastAttendanceMarked }) => (
  <article className="owner-panel owner-panel--attendance">
    <header className="owner-panel__header owner-attendance-header">
      <div><span>Performance</span><h2>Attendance overview</h2></div>
      <div className="owner-attendance-header__actions">
        <div
          className="owner-last-attendance"
          title={lastAttendanceMarked ? `Latest marked attendance: ${lastAttendanceMarked.label}` : "Attendance has not been marked yet"}
        >
          <CalendarCheck2 size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>Last attendance marked</span>
          <strong>
            {lastAttendanceMarked ? <time dateTime={lastAttendanceMarked.dateTime}>{lastAttendanceMarked.label}</time> : "Not marked yet"}
          </strong>
        </div>
        <Link to="/analytics">Detailed analytics <ChevronRight size={15} /></Link>
      </div>
    </header>

    {data.length ? (
      <div className="owner-chart">
        <ResponsiveContainer width="100%" height={285}>
          <ComposedChart data={data} margin={{ top: 18, right: 10, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#e8edf3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="count" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="percentage" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="count" dataKey="present" name="Present" fill="#169447" radius={[5, 5, 0, 0]} barSize={17} />
            <Bar yAxisId="count" dataKey="absent" name="Absent" fill="#ef4444" radius={[5, 5, 0, 0]} barSize={17} />
            <Line yAxisId="percentage" type="monotone" dataKey="attendance" name="Attendance %" stroke="#08162f" strokeWidth={2.5} dot={{ r: 3, fill: "#08162f" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    ) : <div className="owner-dashboard__empty-chart">Attendance trend will appear after attendance is marked.</div>}

    <footer className="owner-panel__metrics">
      <div><small>Today marked</small><strong>{dashboard.todayAttendanceCount || 0}</strong></div>
      <div><small>Attendance rate</small><strong>{dashboard.todayAttendancePercentage || 0}%</strong></div>
      <div><small>Active batches</small><strong>{dashboard.totalBatches || 0}</strong></div>
      <div><small>Upcoming tests</small><strong>{dashboard.upcomingBeltTests || 0}</strong></div>
    </footer>
  </article>
);

export default AttendanceOverview;

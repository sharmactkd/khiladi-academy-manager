import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "../dashboard.utils.js";

const FeeCollectionOverview = ({ canManageFees, data, rate, total }) => (
  <article className="owner-panel owner-panel--fees">
    <header className="owner-panel__header">
      <div><span>Finance</span><h2>Fee collection overview</h2></div>
      {canManageFees ? <Link to="/fees">Open fees <ChevronRight size={15} /></Link> : null}
    </header>
    {total > 0 ? (
      <div className="owner-fee-chart">
        <div className="owner-fee-chart__visual">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={94} startAngle={90} endAngle={-270} paddingAngle={2}>
                {data.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="owner-fee-chart__center"><strong>{rate}%</strong><small>collection rate</small></div>
        </div>
        <div className="owner-fee-chart__legend">
          {data.map((item) => <div key={item.name}><span style={{ backgroundColor: item.color }} /><small>{item.name}</small><strong>{formatMoney(item.value)}</strong></div>)}
        </div>
      </div>
    ) : <div className="owner-dashboard__empty-chart">Fee summary will appear after fee records are added.</div>}
  </article>
);

export default FeeCollectionOverview;

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const BarChartCard = ({
  title,
  data = [],
  xKey = "label",
  yKey = "value",
  height = 280,
}) => {
  return (
    <div className="chart-card" style={{ minWidth: 0 }}>
      <div className="chart-card__header">
        <h3>{title}</h3>
      </div>

      <div style={{ width: "100%", minWidth: 0, height, minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartCard;
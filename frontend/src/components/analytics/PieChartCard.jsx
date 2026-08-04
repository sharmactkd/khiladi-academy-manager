import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const CHART_COLORS = [
  "#cf0006",
  "#640606",
  "#f97316",
  "#15803d",
  "#7c3aed",
  "#0891b2",
  "#d4af37",
  "#6b7280",
];

const PieChartCard = ({
  title,
  data = [],
  nameKey = "label",
  dataKey = "value",
  height = 280,
  colors = CHART_COLORS,
}) => {
  const hasData =
    Array.isArray(data) && data.length > 0;

  return (
    <article className="chart-card">
      <div className="chart-card__header">
        <h3>{title}</h3>
      </div>

      {hasData ? (
        <div
          className="chart-card__canvas"
          style={{
            height,
            minHeight: height,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                cx="50%"
                cy="48%"
                innerRadius={48}
                outerRadius={86}
                paddingAngle={2}
                labelLine={false}
                label={({
                  name,
                  percent,
                }) =>
                  `${name} ${Math.round(
                    (percent || 0) * 100
                  )}%`
                }
              >
                {data.map((item, index) => (
                  <Cell
                    key={
                      item?.[nameKey] ||
                      `pie-item-${index}`
                    }
                    fill={
                      colors[
                        index % colors.length
                      ]
                    }
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 24px rgba(17, 24, 39, 0.1)",
                }}
              />

              <Legend
                iconType="circle"
                iconSize={9}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-card__empty">
          No chart data available.
        </div>
      )}
    </article>
  );
};

export default PieChartCard;
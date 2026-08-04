import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS_COLOR = "#6b7280";
const GRID_COLOR = "#e5e7eb";
const PRIMARY_COLOR = "#cf0006";

const LineChartCard = ({
  title,
  data = [],
  xKey = "label",
  yKey = "value",
  height = 280,
  color = PRIMARY_COLOR,
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
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                stroke={GRID_COLOR}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey={xKey}
                stroke={AXIS_COLOR}
                tickLine={false}
                axisLine={{
                  stroke: GRID_COLOR,
                }}
                tick={{
                  fill: AXIS_COLOR,
                  fontSize: 12,
                }}
              />

              <YAxis
                stroke={AXIS_COLOR}
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: AXIS_COLOR,
                  fontSize: 12,
                }}
              />

              <Tooltip
                contentStyle={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 24px rgba(17, 24, 39, 0.1)",
                }}
                labelStyle={{
                  color: "#111827",
                  fontWeight: 700,
                }}
              />

              <Line
                type="monotone"
                dataKey={yKey}
                stroke={color}
                strokeWidth={3}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                dot={{
                  r: 3,
                  fill: color,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
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

export default LineChartCard;
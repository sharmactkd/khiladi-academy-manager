import MetricCard from "../../../components/common/MetricCard.jsx";

const BatchDetailStat = ({ label, value }) => (
  <MetricCard as="div" className="batch-detail-stat" flat label={label} value={value} />
);

export default BatchDetailStat;

import UpgradeCard from "./UpgradeCard.jsx";

const FeatureGate = ({ allowed, children, title, message }) => {
  if (!allowed) {
    return <UpgradeCard title={title} message={message} />;
  }

  return children;
};

export default FeatureGate;
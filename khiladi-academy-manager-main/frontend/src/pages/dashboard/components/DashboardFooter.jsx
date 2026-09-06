import { dateFormatter } from "../dashboard.utils.js";

const DashboardFooter = ({ medalsTotal }) => (
  <footer className="owner-dashboard__footer">
    <span>KHILADI Academy Manager</span>
    <span>{dateFormatter.format(new Date())}</span>
    <span>{medalsTotal} recorded medal{medalsTotal === 1 ? "" : "s"}</span>
  </footer>
);

export default DashboardFooter;

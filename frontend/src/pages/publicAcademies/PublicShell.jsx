import { Link } from "react-router-dom";
import logo from "../../assets/images/branding/khiladi-logo.png";
import "./PublicAcademies.css";
export default function PublicShell({ children }) { return <div className="pa-page"><nav className="pa-nav"><Link className="pa-brand" to="/academies"><img src={logo} alt="KHILADI"/><span>KHILADI Academy</span></Link><div className="pa-navlinks"><Link className="pa-link" to="/academies">Explore</Link><Link className="pa-button" to="/login">Academy Login</Link></div></nav>{children}</div>; }

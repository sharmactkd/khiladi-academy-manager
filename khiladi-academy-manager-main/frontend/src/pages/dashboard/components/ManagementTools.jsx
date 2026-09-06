import { Link } from "react-router-dom";

const ManagementTools = ({ groups }) => (
  <section className="owner-management">
    <header>
      <div><span>Academy workspace</span><h2>Management tools</h2></div>
      <p>All existing academy, document and communication features remain available.</p>
    </header>
    <div className="owner-management__grid">
      {groups.map(({ description, icon: Icon, links, title }) => (
        <article key={title}>
          <span><Icon /></span><h3>{title}</h3><p>{description}</p>
          <div>{links.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}</div>
        </article>
      ))}
    </div>
  </section>
);

export default ManagementTools;

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="center-page">
      <div className="card center-card">
        <h1>404</h1>
        <p className="muted">Page not found.</p>
        <Link className="btn btn-primary" to="/">
          Go to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;

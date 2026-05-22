import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <main className="center-page">
      <div className="card center-card">
        <h1>Unauthorized</h1>
        <p className="muted">You do not have permission to access this page.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
};

export default Unauthorized;
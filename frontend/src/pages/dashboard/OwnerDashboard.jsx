import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { academyApi } from "../../api/academyApi.js";
import useAuth from "../../hooks/useAuth.js";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAcademy = async () => {
      try {
        const response = await academyApi.getMyAcademy();
        setAcademy(response.data?.data?.academy || null);
      } catch {
        setAcademy(null);
      } finally {
        setLoading(false);
      }
    };

    loadAcademy();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p className="muted">Manage your academy foundation from here.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Current User</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email || "Not added"}</p>
          <p><strong>Phone:</strong> {user?.phone || "Not added"}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>

        <div className="card">
          <h3>Academy Profile</h3>

          {loading ? (
            <p>Loading academy...</p>
          ) : academy ? (
            <>
              <p><strong>Name:</strong> {academy.academyName}</p>
              <p><strong>Martial Arts:</strong> {academy.martialArts?.join(", ")}</p>
              <p><strong>City:</strong> {academy.city || "Not added"}</p>
              <p><strong>Plan:</strong> {academy.subscriptionPlan}</p>
            </>
          ) : (
            <>
              <p className="muted">
                You have not created your academy profile yet.
              </p>
              <Link className="btn btn-primary" to="/onboarding/create-academy">
                Create Academy Profile
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
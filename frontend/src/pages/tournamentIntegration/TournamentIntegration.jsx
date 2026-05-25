import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth.js";
import { tournamentIntegrationApi } from "../../api/tournamentIntegrationApi.js";
import IntegrationStatusBadge from "../../components/tournament/IntegrationStatusBadge.jsx";
import SyncLogTable from "../../components/tournament/SyncLogTable.jsx";

const TournamentIntegration = () => {
  const { user } = useAuth();

  const canManageIntegration = ["super_admin", "academy_owner"].includes(
    user?.role
  );

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [integration, setIntegration] = useState(null);
  const [logs, setLogs] = useState([]);
  const [secrets, setSecrets] = useState(null);

  const [form, setForm] = useState({
    integrationName: "KHILADI Tournament Manager",
    apiBaseUrl: "",
  });

  const loadData = async () => {
    try {
      const [statusResponse, logsResponse] = await Promise.all([
        tournamentIntegrationApi.getStatus(),
        canManageIntegration
          ? tournamentIntegrationApi.getLogs({ limit: 20 })
          : Promise.resolve({ data: { data: { logs: [] } } }),
      ]);

      const statusData = statusResponse.data?.data;
      setConnected(Boolean(statusData?.connected));
      setIntegration(statusData?.integration || null);
      setForm((prev) => ({
        ...prev,
        integrationName:
          statusData?.integration?.integrationName ||
          "KHILADI Tournament Manager",
        apiBaseUrl: statusData?.integration?.apiBaseUrl || "",
      }));

      setLogs(logsResponse.data?.data?.logs || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Tournament integration load nahi hua"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnect = async (event) => {
    event.preventDefault();

    try {
      setActionLoading(true);
      setSecrets(null);

      const response = await tournamentIntegrationApi.connect(form);
      const data = response.data?.data;

      setConnected(true);
      setIntegration(data?.integration || null);
      setSecrets(data?.credentials || null);

      toast.success("Tournament integration connected");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Integration connect failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      await tournamentIntegrationApi.disconnect();
      setSecrets(null);
      toast.success("Integration disconnected");
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Integration disconnect failed"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setActionLoading(true);
      const response = await tournamentIntegrationApi.regenerateKey();
      setSecrets(response.data?.data?.credentials || null);
      toast.success("Keys regenerated");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Key regenerate failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Loading tournament integration...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tournament Integration</h1>
          <p>Connect Academy Manager with KHILADI Tournament Manager.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="page-header">
            <div>
              <h2>Integration Status</h2>
              <p>{integration?.integrationName || "Not connected"}</p>
            </div>

            <IntegrationStatusBadge status={integration?.status || "inactive"} />
          </div>

          <div className="details-grid">
            <p>
              <strong>Provider:</strong>{" "}
              {integration?.provider || "khiladi_tournament_manager"}
            </p>
            <p>
              <strong>API Base URL:</strong> {integration?.apiBaseUrl || "-"}
            </p>
            <p>
              <strong>Last Sync:</strong>{" "}
              {integration?.lastSyncAt
                ? new Date(integration.lastSyncAt).toLocaleString()
                : "-"}
            </p>
            <p>
              <strong>Last Error:</strong> {integration?.lastError || "-"}
            </p>
          </div>
        </div>

        <div className="card">
          <h2>{connected ? "Update Connection" : "Connect Integration"}</h2>

          {!canManageIntegration && (
            <p>Only academy owner or super admin can connect/disconnect.</p>
          )}

          {canManageIntegration && (
            <form onSubmit={handleConnect} className="form">
              <label>
                Integration Name
                <input
                  name="integrationName"
                  value={form.integrationName}
                  onChange={handleChange}
                  placeholder="KHILADI Tournament Manager"
                />
              </label>

              <label>
                API Base URL
                <input
                  name="apiBaseUrl"
                  value={form.apiBaseUrl}
                  onChange={handleChange}
                  placeholder="https://khiladi-khoj.com"
                />
              </label>

              <div className="actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {connected ? "Reconnect" : "Connect"}
                </button>

                {connected && (
                  <>
                    <button
                      type="button"
                      className="btn"
                      disabled={actionLoading}
                      onClick={handleRegenerate}
                    >
                      Regenerate Key
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={actionLoading}
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {secrets && (
        <div className="card warning-card">
          <h2>Copy this now. It will not be shown again.</h2>

          <p>
            <strong>API Key:</strong>
          </p>
          <pre>{secrets.apiKey}</pre>

          <p>
            <strong>Webhook Secret:</strong>
          </p>
          <pre>{secrets.webhookSecret}</pre>
        </div>
      )}

      {canManageIntegration && (
        <div className="card">
          <h2>Integration Logs</h2>
          <SyncLogTable logs={logs} />
        </div>
      )}
    </div>
  );
};

export default TournamentIntegration;
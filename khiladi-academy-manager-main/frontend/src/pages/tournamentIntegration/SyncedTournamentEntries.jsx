import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { tournamentSyncApi } from "../../api/tournamentSyncApi.js";
import TournamentEntryCard from "../../components/tournament/TournamentEntryCard.jsx";

const SyncedTournamentEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const response = await tournamentSyncApi.getEntries({ limit: 100 });
      setEntries(response.data?.data?.entrySyncs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Entries load nahi hui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleCancel = async (id) => {
    try {
      await tournamentSyncApi.cancelEntry(id);
      toast.success("Entry cancelled");
      await loadEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  if (loading) return <p>Loading entries...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Synced Tournament Entries</h1>
          <p>Submitted tournament entries aur sync status yahan dikhega.</p>
        </div>

        <Link className="btn btn-primary" to="/tournament-sync/entries/new">
          Submit New Entry
        </Link>
      </div>

      <div className="grid grid-2">
        {entries.map((entry) => (
          <TournamentEntryCard
            key={entry._id}
            entry={entry}
            onCancel={handleCancel}
          />
        ))}
      </div>

      {!entries.length && (
        <div className="card">
          <p>No synced tournament entries found.</p>
        </div>
      )}
    </div>
  );
};

export default SyncedTournamentEntries;
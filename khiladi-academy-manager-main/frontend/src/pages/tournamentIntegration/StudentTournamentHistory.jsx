import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { tournamentSyncApi } from "../../api/tournamentSyncApi.js";
import TournamentEntryCard from "../../components/tournament/TournamentEntryCard.jsx";
import TournamentResultCard from "../../components/tournament/TournamentResultCard.jsx";

const StudentTournamentHistory = () => {
  const { studentId } = useParams();

  const [entries, setEntries] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [entriesResponse, resultsResponse] = await Promise.all([
          tournamentSyncApi.getStudentEntries(studentId),
          tournamentSyncApi.getStudentResults(studentId),
        ]);

        setEntries(entriesResponse.data?.data?.entrySyncs || []);
        setResults(resultsResponse.data?.data?.resultSyncs || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Tournament history load nahi hui"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [studentId]);

  if (loading) return <p>Loading tournament history...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Tournament History</h1>
          <p>Synced entries aur imported results.</p>
        </div>
      </div>

      <div className="card">
        <h2>Imported Results</h2>
      </div>

      <div className="grid grid-2">
        {results.map((result) => (
          <TournamentResultCard key={result._id} result={result} />
        ))}
      </div>

      {!results.length && (
        <div className="card">
          <p>No tournament results found.</p>
        </div>
      )}

      <div className="card">
        <h2>Synced Entries</h2>
      </div>

      <div className="grid grid-2">
        {entries.map((entry) => (
          <TournamentEntryCard key={entry._id} entry={entry} />
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

export default StudentTournamentHistory;
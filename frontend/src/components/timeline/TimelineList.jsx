const TimelineList = ({ timeline = [] }) => {
  if (!timeline.length) {
    return <div className="card">No timeline events found.</div>;
  }

  return (
    <div className="card timeline-list">
      {timeline.map((event) => (
        <div className="timeline-item" key={event._id}>
          <div className="timeline-dot" />

          <div className="timeline-content">
            <div className="timeline-header">
              <strong>{event.title}</strong>
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>

            <p>{event.description || "No description"}</p>

            <small>
              Type: {event.type} | Source: {event.sourceModule}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineList;
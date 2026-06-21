export default function CourtGrid({ court, playersData, generalCount, winnersCount, losersCount, nextStreamType, onLaunchNext, onResolve }) {
  const isOccupied = court.status === "Occupied";

  const renderPlayerBadge = (name) => {
    const p = playersData[name];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {p?.image ? (
          <img src={p.image} alt={name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--charcoal-dark)" }} />
        ) : (
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "bold" }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: "1rem", fontWeight: 700 }}>{name}</span>
      </div>
    );
  };

  // Determine what the single button display says based on queue content statuses
  const getButtonText = () => {
    if (generalCount >= 4) return `Play Fresh Pool Match (${Math.floor(generalCount / 4)} left)`;
    
    return nextStreamType === "winners" 
      ? `Play Next: Winners Bracket Line ➡️` 
      : `Play Next: Losers Bracket Line ➡️`;
  };

  const isButtonDisabled = () => {
    if (generalCount >= 4) return false;
    return winnersCount < 4 && losersCount < 4;
  };

  return (
    <div className={`court-card-single ${isOccupied ? "occupied" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900 }}>{court.name}</h3>
        <span style={{ 
          fontSize: "0.75rem", 
          fontWeight: 800, 
          padding: "0.25rem 0.75rem", 
          borderRadius: "4px",
          backgroundColor: isOccupied ? "var(--charcoal-dark)" : "var(--optic-yellow)",
          color: isOccupied ? "var(--bg-primary)" : "var(--charcoal-dark)"
        }}>
          {court.status.toUpperCase()}
        </span>
      </div>

      {isOccupied ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="match-team" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ color: "var(--gray-text-muted)", fontSize: "0.75rem", fontWeight: 800 }}>TEAM 1</span>
            {renderPlayerBadge(court.team1[0])}
            {renderPlayerBadge(court.team1[1])}
          </div>
          
          <div style={{ fontSize: "0.8rem", textAlign: "center", fontWeight: 900, color: "var(--gray-text-muted)" }}>VS</div>
          
          <div className="match-team" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ color: "var(--gray-text-muted)", fontSize: "0.75rem", fontWeight: 800 }}>TEAM 2</span>
            {renderPlayerBadge(court.team2[0])}
            {renderPlayerBadge(court.team2[1])}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button className="btn-score-win" onClick={() => onResolve(court.team1, court.team2)}>
              Team 1 Won
            </button>
            <button className="btn-score-win" onClick={() => onResolve(court.team2, court.team1)}>
              Team 2 Won
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: "var(--gray-text-muted)", fontSize: "0.9rem", fontStyle: "italic", margin: "0 0 1.5rem 0" }}>
            The arena is vacant. Click below to pull the next 4 players automatically:
          </p>
          <button 
            className="btn-primary" 
            disabled={isButtonDisabled()}
            onClick={onLaunchNext}
            style={{ fontSize: "0.95rem", padding: "1.2rem" }}
          >
            {getButtonText()}
          </button>
        </div>
      )}
    </div>
  );
}
export default function CourtGrid({ court, playersData, generalCount, winnersCount, losersCount, onAssign, onResolve }) {
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
            The court is vacant. Choose a pipeline to automatically pull the next 4 players:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <button className="btn-primary" style={{ backgroundColor: "var(--charcoal-dark)", color: "var(--bg-primary)", fontSize: "0.75rem" }} disabled={generalCount < 4} onClick={() => onAssign("general")}>
              Fresh Pool ({Math.floor(generalCount / 4)})
            </button>
            <button className="btn-primary" style={{ fontSize: "0.75rem" }} disabled={winnersCount < 4} onClick={() => onAssign("winners")}>
              Winners Line ({Math.floor(winnersCount / 4)})
            </button>
            <button className="btn-primary" style={{ backgroundColor: "var(--gray-border)", boxShadow: "0 4px 0px var(--charcoal-dark)", fontSize: "0.75rem" }} disabled={losersCount < 4} onClick={() => onAssign("losers")}>
              Losers Line ({Math.floor(losersCount / 4)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
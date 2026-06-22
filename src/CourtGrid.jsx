import { useState, useEffect } from "react";

export default function CourtGrid({ 
  court, setCourt, playersData, generalQueue, setGeneralQueue, 
  winnersQueue, setWinnersQueue, losersQueue, setLosersQueue, 
  nextStreamType, onLaunchNext, onResolve 
}) {
  const isOccupied = court.status === "Occupied";
  const allPlayerNames = Object.keys(playersData);

  const [nextTeam1, setNextTeam1] = useState([]);
  const [nextTeam2, setNextTeam2] = useState([]);

  // Live Match preview blending builder
  useEffect(() => {
    if (isOccupied) return;

    let sourcePool = [];
    const freshCount = generalQueue.length;

    if (freshCount >= 4) {
      sourcePool = generalQueue.slice(0, 4);
    } else if (freshCount > 0) {
      // Gather odd player remnants from the fresh pool first
      sourcePool = [...generalQueue];
      const needed = 4 - freshCount;
      
      // Blend them with the active loop track line target
      if (nextStreamType === "winners") {
        sourcePool = [...sourcePool, ...winnersQueue.slice(0, needed)];
      } else {
        sourcePool = [...sourcePool, ...losersQueue.slice(0, needed)];
      }
    } else {
      // Direct Loop Bracket target pulling
      sourcePool = nextStreamType === "winners" 
        ? (winnersQueue.length >= 4 ? winnersQueue.slice(0, 4) : losersQueue.slice(0, 4))
        : (losersQueue.length >= 4 ? losersQueue.slice(0, 4) : winnersQueue.slice(0, 4));
    }

    if (sourcePool.length === 4) {
      setNextTeam1([sourcePool[0], sourcePool[1]]);
      setNextTeam2([sourcePool[2], sourcePool[3]]);
    } else {
      setNextTeam1([]);
      setNextTeam2([]);
    }
  }, [court, generalQueue, winnersQueue, losersQueue, nextStreamType, isOccupied]);

  const changeLivePlayer = (teamKey, index, newName) => {
    setCourt(prev => {
      const updatedTeam = [...prev[teamKey]];
      updatedTeam[index] = newName;
      return { ...prev, [teamKey]: updatedTeam };
    });
  };

  const changeUpcomingPlayer = (teamKey, index, newName) => {
    if (teamKey === "team1") {
      setNextTeam1(prev => prev.map((p, i) => i === index ? newName : p));
    } else {
      setNextTeam2(prev => prev.map((p, i) => i === index ? newName : p));
    }
  };

  const launchCustomLineup = () => {
    if (nextTeam1.length < 2 || nextTeam2.length < 2) return;

    const freshCount = generalQueue.length;
    if (freshCount >= 4) {
      setGeneralQueue(prev => prev.slice(4));
    } else if (freshCount > 0) {
      setGeneralQueue([]);
      const needed = 4 - freshCount;
      if (nextStreamType === "winners") {
        setWinnersQueue(prev => prev.slice(needed));
      } else {
        setLosersQueue(prev => prev.slice(needed));
      }
    } else {
      if (nextStreamType === "winners" && winnersQueue.length >= 4) {
        setWinnersQueue(prev => prev.slice(4));
      } else if (nextStreamType === "losers" && losersQueue.length >= 4) {
        setLosersQueue(prev => prev.slice(4));
      } else if (winnersQueue.length >= 4) {
        setWinnersQueue(prev => prev.slice(4));
      } else {
        setLosersQueue(prev => prev.slice(4));
      }
    }

    onLaunchNext({ team1: nextTeam1, team2: nextTeam2 });
  };

  const renderPlayerEditor = (currentName, onSelectChange) => {
    const p = playersData[currentName];
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", background: "rgba(0,0,0,0.2)", padding: "0.4rem 0.75rem", borderRadius: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {p?.image ? (
            <img src={p.image} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid white" }} />
          ) : (
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>
              {currentName ? currentName.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>{currentName || "Select Player..."}</span>
        </div>
        <select 
          value={currentName} 
          onChange={(e) => onSelectChange(e.target.value)}
          style={{ backgroundColor: "var(--charcoal-dark)", color: "white", border: "1px solid var(--optic-yellow)", borderRadius: "4px", padding: "0.2rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: "bold" }}
        >
          <option value="" disabled>Change...</option>
          {allPlayerNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className={`court-card-single ${isOccupied ? "occupied" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900 }}>{court.name}</h3>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.25rem 0.75rem", borderRadius: "4px", backgroundColor: isOccupied ? "var(--charcoal-dark)" : "var(--optic-yellow)", color: isOccupied ? "var(--bg-primary)" : "var(--charcoal-dark)" }}>
          {isOccupied ? "MATCH LIVE" : "COURT OPEN"}
        </span>
      </div>

      {isOccupied ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="match-team" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ color: "var(--optic-yellow)", fontSize: "0.75rem", fontWeight: 900 }}>TEAM 1 (EDITABLE)</span>
            {renderPlayerEditor(court.team1[0], (val) => changeLivePlayer("team1", 0, val))}
            {renderPlayerEditor(court.team1[1], (val) => changeLivePlayer("team1", 1, val))}
          </div>
          <div style={{ fontSize: "0.8rem", textAlign: "center", fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>VS</div>
          <div className="match-team" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ color: "var(--optic-yellow)", fontSize: "0.75rem", fontWeight: 900 }}>TEAM 2 (EDITABLE)</span>
            {renderPlayerEditor(court.team2[0], (val) => changeLivePlayer("team2", 0, val))}
            {renderPlayerEditor(court.team2[1], (val) => changeLivePlayer("team2", 1, val))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button className="btn-score-win" onClick={() => onResolve(court.team1, court.team2)}>Team 1 Won</button>
            <button className="btn-score-win" onClick={() => onResolve(court.team2, court.team1)}>Team 2 Won</button>
          </div>
        </div>
      ) : (
        <div>
          {nextTeam1.length === 2 && nextTeam2.length === 2 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(0,0,0,0.15)", padding: "1.25rem", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--optic-yellow)" }}>🔮 NEXT AUTO-MATCH LINEUP PREVIEW:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {renderPlayerEditor(nextTeam1[0], (val) => changeUpcomingPlayer("team1", 0, val))}
                {renderPlayerEditor(nextTeam1[1], (val) => changeUpcomingPlayer("team1", 1, val))}
              </div>
              <div style={{ fontSize: "0.75rem", textAlign: "center", opacity: 0.5 }}>VS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {renderPlayerEditor(nextTeam2[0], (val) => changeUpcomingPlayer("team2", 0, val))}
                {renderPlayerEditor(nextTeam2[1], (val) => changeUpcomingPlayer("team2", 1, val))}
              </div>
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontStyle: "italic", margin: "0 0 1.5rem 0" }}>
              Awaiting more players to queue up...
            </p>
          )}

          <button 
            className="btn-primary" 
            disabled={nextTeam1.length < 2 || nextTeam2.length < 2}
            onClick={launchCustomLineup}
            style={{ fontSize: "0.95rem", padding: "1.2rem" }}
          >
            {generalQueue.length > 0 
              ? ` Deploy Blended Fresh Match` 
              : ` Deploy Next: ${nextStreamType.toUpperCase()} Bracket Line`}
          </button>
        </div>
      )}
    </div>
  );
}
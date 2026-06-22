import { useState, useRef, useEffect } from "react";
import "./App.css";
import QueueSection from "./QueueSection";
import CourtGrid from "./CourtGrid";
import Leaderboard from "./Leaderboard";

const INITIAL_COURT = { id: 1, name: "Main Stadium Court", status: "Available", team1: null, team2: null };

export default function App() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [playerImage, setPlayerImage] = useState(null); 
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [winningMatchResult, setWinningMatchResult] = useState(null);
  const [court, setCourt] = useState(INITIAL_COURT);
  const [endGameSummary, setEndGameSummary] = useState(null);
  const [nextStreamType, setNextStreamType] = useState("winners"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedArchivedSession, setSelectedArchivedSession] = useState(null);

  // --- ARMED STRUCTURAL RENAME TRACKING STATES ---
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameInputValue, setRenameInputValue] = useState("");

  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem("dinka_players");
    return saved ? JSON.parse(saved) : {};
  });
  
  const [generalQueue, setGeneralQueue] = useState(() => {
    const saved = localStorage.getItem("dinka_generalQueue");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [winnersQueue, setWinnersQueue] = useState(() => {
    const saved = localStorage.getItem("dinka_winnersQueue");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [losersQueue, setLosersQueue] = useState(() => {
    const saved = localStorage.getItem("dinka_losersQueue");
    return saved ? JSON.parse(saved) : [];
  });

  const [sessionLogs, setSessionLogs] = useState(() => {
    const saved = localStorage.getItem("dinka_sessionLogs");
    return saved ? JSON.parse(saved) : [];
  });

  const [pastSessions, setPastSessions] = useState(() => {
    const saved = localStorage.getItem("dinka_pastSessions");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("dinka_players", JSON.stringify(players));
    localStorage.setItem("dinka_generalQueue", JSON.stringify(generalQueue));
    localStorage.setItem("dinka_winnersQueue", JSON.stringify(winnersQueue));
    localStorage.setItem("dinka_losersQueue", JSON.stringify(losersQueue));
    localStorage.setItem("dinka_sessionLogs", JSON.stringify(sessionLogs));
    localStorage.setItem("dinka_pastSessions", JSON.stringify(pastSessions));
  }, [players, generalQueue, winnersQueue, losersQueue, sessionLogs, pastSessions]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    setPlayerImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error: ", err);
      setIsCameraActive(false);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    setPlayerImage(canvas.toDataURL("image/jpeg"));
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    if (!name || players[name]) return;

    setPlayers((prev) => ({
      ...prev,
      [name]: { name, wins: 0, losses: 0, image: playerImage }
    }));
    setGeneralQueue((prev) => [...prev, name]);
    setNewPlayerName("");
    setPlayerImage(null);
  };

  const handleDeletePlayer = (targetName) => {
    if (court.status === "Occupied" && [...court.team1, ...court.team2].includes(targetName)) {
      alert("Cannot delete an active player!");
      return;
    }
    if (!window.confirm(`Remove ${targetName} entirely?`)) return;

    setPlayers((prev) => {
      const copy = { ...prev };
      delete copy[targetName];
      return copy;
    });
    setGeneralQueue((prev) => prev.filter(name => name !== targetName));
    setWinnersQueue((prev) => prev.filter(name => name !== targetName));
    setLosersQueue((prev) => prev.filter(name => name !== targetName));
  };

  const handleShufflePool = () => {
    setGeneralQueue((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const triggerNextAutomatedMatch = (overrideTeams) => {
    if (court.status === "Occupied") return;
    
    if (overrideTeams) {
      setCourt({ ...court, status: "Occupied", team1: overrideTeams.team1, team2: overrideTeams.team2 });
      if (generalQueue.length < 4) {
        setNextStreamType((prev) => (prev === "winners" ? "losers" : "winners"));
      }
      return;
    }

    let pool = [];
    let currentStream = nextStreamType;
    const useFreshPool = generalQueue.length >= 4 || (generalQueue.length > 0 && (winnersQueue.length + losersQueue.length > 0));

    if (useFreshPool) {
      const freshPlayersToTake = Math.min(generalQueue.length, 4);
      pool = generalQueue.slice(0, freshPlayersToTake);
      const slotsNeeded = 4 - pool.length;
      
      if (slotsNeeded > 0) {
        if (currentStream === "winners" && winnersQueue.length >= slotsNeeded) {
          pool = [...pool, ...winnersQueue.slice(0, slotsNeeded)];
          setWinnersQueue(prev => prev.slice(slotsNeeded));
          setNextStreamType("losers");
        } else if (losersQueue.length >= slotsNeeded) {
          pool = [...pool, ...losersQueue.slice(0, slotsNeeded)];
          setLosersQueue(prev => prev.slice(slotsNeeded));
          setNextStreamType("winners");
        } else {
          alert("Waiting for active court matches to finish to fill the remaining slots!");
          return;
        }
      }
      setGeneralQueue(prev => prev.slice(freshPlayersToTake));
    } else {
      if (currentStream === "winners") {
        if (winnersQueue.length >= 4) {
          pool = winnersQueue.slice(0, 4);
          setWinnersQueue(prev => prev.slice(4));
          setNextStreamType("losers");
        } else if (losersQueue.length >= 4) {
          pool = losersQueue.slice(0, 4);
          setLosersQueue(prev => prev.slice(4));
          setNextStreamType("winners");
        } else {
          alert("Not enough rotation players available yet.");
          return;
        }
      } else {
        if (losersQueue.length >= 4) {
          pool = losersQueue.slice(0, 4);
          setLosersQueue(prev => prev.slice(4));
          setNextStreamType("winners");
        } else if (winnersQueue.length >= 4) {
          pool = winnersQueue.slice(0, 4);
          setWinnersQueue(prev => prev.slice(4));
          setNextStreamType("losers");
        } else {
          alert("Not enough rotation players available yet.");
          return;
        }
      }
    }

    setCourt({
      ...court,
      status: "Occupied",
      team1: [pool[0], pool[1]],
      team2: [pool[2], pool[3]]
    });
  };

  const handleResolveMatch = (winningTeam, losingTeam) => {
    setPlayers((prev) => {
      const updated = { ...prev };
      winningTeam.forEach((p) => {
        if (updated[p]) updated[p] = { ...updated[p], wins: updated[p].wins + 1 };
      });
      losingTeam.forEach((p) => {
        if (updated[p]) updated[p] = { ...updated[p], losses: updated[p].losses + 1 };
      });
      return updated;
    });

    const newLogEntry = {
      id: crypto.randomUUID(),
      winners: [...winningTeam],
      losers: [...losingTeam],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSessionLogs(prev => [newLogEntry, ...prev]);

    setWinnersQueue((prev) => [...prev, ...winningTeam]);
    setLosersQueue((prev) => [...prev, ...losingTeam]);
    setWinningMatchResult(winningTeam);
    setCourt(INITIAL_COURT);
  };

  const handleTriggerEndSession = () => {
    if (Object.keys(players).length === 0) return;
    const rankedList = Object.values(players).map((p) => {
      const total = p.wins + p.losses;
      const rate = total > 0 ? ((p.wins / total) * 100).toFixed(0) : 0;
      return { ...p, rate: Number(rate), total };
    }).sort((a, b) => b.rate - a.rate || b.wins - a.wins);
    setEndGameSummary(rankedList);
  };

  const handleConfirmCloseSession = () => {
    const sessionTitle = `Session ${new Date().toLocaleDateString()} (${Object.keys(players).length} Players)`;
    const archivalPackage = {
      id: crypto.randomUUID(),
      title: sessionTitle,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      standings: [...endGameSummary],
      matches: [...sessionLogs]
    };

    setPastSessions(prev => [archivalPackage, ...prev]);

    localStorage.removeItem("dinka_players");
    localStorage.removeItem("dinka_generalQueue");
    localStorage.removeItem("dinka_winnersQueue");
    localStorage.removeItem("dinka_losersQueue");
    localStorage.removeItem("dinka_sessionLogs");

    setPlayers({});
    setGeneralQueue([]);
    setWinnersQueue([]);
    setLosersQueue([]);
    setSessionLogs([]);
    setNextStreamType("winners");
    setEndGameSummary(null);
  };

  // --- NEW: SESSION RENAME PROCESSING ENGINE ---
  const handleStartRename = (e, session) => {
    e.stopPropagation(); // Prevents opening the archive popup overlay card unexpectedly
    setEditingSessionId(session.id);
    setRenameInputValue(session.title);
  };

  const handleSaveRename = (e, id) => {
    e.stopPropagation();
    if (!renameInputValue.trim()) return;

    setPastSessions(prev => prev.map(s => s.id === id ? { ...s, title: renameInputValue.trim() } : s));
    setEditingSessionId(null);
  };

  return (
    <div className="app-container">
      {/* GEMINI RECENTS SIDEBAR ARCHIVE SYSTEM WITH RENAME HOOKS */}
      <aside className={`gemini-match-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header-title">
          <span style={{ color: "var(--gray-text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>Recents</span>
          <button className="icon-close-toggle" onClick={() => setIsSidebarOpen(false)}>×</button>
        </div>
        
        <div className="sidebar-scroll-deck" style={{ padding: "0.5rem 0.75rem" }}>
          {pastSessions.length === 0 ? (
            <div className="empty-sidebar-prompt">Saved sessions will appear here after you click End Session.</div>
          ) : (
            pastSessions.map((session) => (
              <div 
                key={session.id} 
                className={`gemini-chat-log-item ${editingSessionId === session.id ? "editing" : ""}`}
                onClick={() => editingSessionId !== session.id && setSelectedArchivedSession(session)}
              >
                <span className="gemini-chat-icon">🎾</span>
                
                {editingSessionId === session.id ? (
                  <div style={{ display: "flex", gap: "0.25rem", width: "100%", alignItems: "center" }}>
                    <input 
                      type="text" 
                      className="sidebar-rename-input"
                      value={renameInputValue}
                      onChange={(e) => setRenameInputValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Stop overlay from opening on text focus clicks
                      autoFocus
                    />
                    <button className="btn-rename-save" onClick={(e) => handleSaveRename(e, session.id)}>✔</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }} className="sidebar-title-row-container">
                    <span className="gemini-chat-title">{session.title}</span>
                    <button className="sidebar-edit-trigger-btn" onClick={(e) => handleStartRename(e, session)} title="Rename Session">✏️</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* WORKSPACE */}
      <div className={`main-workspace-content ${isSidebarOpen ? "shifted" : "full"}`}>
        <header className="app-header">
          <div className="header-content">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {!isSidebarOpen && (
                <button className="gemini-hamburger" onClick={() => setIsSidebarOpen(true)}>☰</button>
              )}
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.65rem", letterSpacing: "-0.5px" }}>⚡ Pickle Queuer</h1>
            </div>
            
            <button onClick={handleTriggerEndSession} className="btn-primary" style={{ width: "auto", padding: "0.5rem 1rem", boxShadow: "3px 3px 0px #000" }}>
              🏁 End Session
            </button>
          </div>
        </header>

        <main className="dashboard-grid">
          <div className="main-column">
            <div className="panel-card">
              <h2 className="panel-title">Player Sign-Up</h2>
              <form onSubmit={handleAddPlayer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input type="text" className="form-input" placeholder="Enter player name..." value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} required />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", background: "var(--gray-bg-muted)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--gray-border)" }}>
                  {isCameraActive && <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxWidth: "200px", height: "200px", objectFit: "cover", borderRadius: "50%", border: "3px solid var(--charcoal-dark)", transform: "scaleX(-1)" }} />}
                  {playerImage && <img src={playerImage} alt="" style={{ width: "200px", height: "200px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--charcoal-dark)" }} />}
                  <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                    {!isCameraActive ? <button type="button" onClick={startCamera} className="btn-score-win" style={{ width: "100%" }}>📸 Open Camera</button> : <button type="button" onClick={captureSnapshot} className="btn-score-win" style={{ width: "100%", backgroundColor: "var(--optic-yellow)" }}>🎯 Capture</button>}
                  </div>
                </div>
                <button type="submit" className="btn-primary">Add Player</button>
              </form>
              {generalQueue.length > 0 && <button onClick={handleShufflePool} className="btn-primary" style={{ marginTop: "1rem", backgroundColor: "var(--gray-border)", boxShadow: "none", color: "var(--charcoal-dark)" }}>🎲 Shuffle Pool</button>}
            </div>

            <div className="panel-card">
              <h2 className="panel-title">Standings & Placings</h2>
              <Leaderboard players={players} onDeletePlayer={handleDeletePlayer} />
            </div>
          </div>

          <div className="main-column">
            <div className="panel-card">
              <h2 className="panel-title">Live Arena Progress</h2>
              <CourtGrid court={court} setCourt={setCourt} playersData={players} generalQueue={generalQueue} setGeneralQueue={setGeneralQueue} winnersQueue={winnersQueue} setWinnersQueue={setWinnersQueue} losersQueue={losersQueue} setLosersQueue={setLosersQueue} nextStreamType={nextStreamType} onLaunchNext={triggerNextAutomatedMatch} onResolve={handleResolveMatch} />
            </div>

            <div className="panel-card">
              <h2 className="panel-title">Rotation Pipelines</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <QueueSection title="1. Fresh Waiting Pool" queueData={generalQueue} playersData={players} tagColor="var(--charcoal-dark)" onDeletePlayer={handleDeletePlayer} showDelete={true} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <QueueSection title="2. Winners Line" queueData={winnersQueue} playersData={players} tagColor="var(--optic-yellow)" />
                  <QueueSection title="3. Losers Line" queueData={losersQueue} playersData={players} tagColor="var(--gray-border)" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MATCH WIN POPUP */}
      {winningMatchResult && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17, 18, 16, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="panel-card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", border: "3px solid var(--charcoal-dark)" }}>
            <span style={{ fontSize: "3rem" }}>🏆</span>
            <h2 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "1.5rem", margin: "0.5rem 0" }}>Winners Bracket Advanced!</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", margin: "1.5rem 0" }}>
              {winningMatchResult.map((name) => {
                const p = players[name];
                return (
                  <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    {p?.image ? <img src={p.image} alt="" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--optic-yellow)" }} /> : <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: "bold" }}>{name.charAt(0).toUpperCase()}</div>}
                    <span style={{ fontWeight: 800 }}>{name}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn-primary" onClick={() => setWinningMatchResult(null)}>Dismiss Bracket</button>
          </div>
        </div>
      )}

      {/* END SESSION REVIEW MODAL */}
      {endGameSummary && (
        <div className="end-session-overlay">
          <div className="end-session-modal-card" style={{ maxWidth: "900px" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <span style={{ fontSize: "3.5rem" }}>🏁</span>
              <h1 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "2.25rem", margin: "0.5rem 0 0 0", color: "var(--charcoal-dark)" }}>Review & Save Session</h1>
            </div>

            <div className="podium-container">
              {endGameSummary[1] && (
                <div className="podium-column" style={{ width: "110px" }}>
                  {endGameSummary[1].image ? <img src={endGameSummary[1].image} alt="" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--charcoal-dark)" }} /> : <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#b0b8ad", display: "flex", alignItems: "center", justifyContent: "center" }}>🥈</div>}
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", marginTop: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px", color: "var(--charcoal-dark)" }}>{endGameSummary[1].name}</span>
                  <div className="podium-base-silver">#2 Silver</div>
                </div>
              )}
              {endGameSummary[0] && (
                <div className="podium-column" style={{ width: "130px" }}>
                  {endGameSummary[0].image ? <img src={endGameSummary[0].image} alt="" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--optic-yellow)" }} /> : <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>👑</div>}
                  <span style={{ fontWeight: 900, fontSize: "1.05rem", marginTop: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", color: "var(--charcoal-dark)" }}>{endGameSummary[0].name}</span>
                  <div className="podium-base-gold">#1 Gold</div>
                </div>
              )}
              {endGameSummary[2] && (
                <div className="podium-column" style={{ width: "110px" }}>
                  {endGameSummary[2].image ? <img src={endGameSummary[2].image} alt="" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--charcoal-dark)" }} /> : <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#cd7f32", display: "flex", alignItems: "center", justifyContent: "center" }}>🥉</div>}
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", marginTop: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px", color: "var(--charcoal-dark)" }}>{endGameSummary[2].name}</span>
                  <div className="podium-base-bronze">#3 Bronze</div>
                </div>
              )}
            </div>

            <div className="end-session-layout-wrapper">
              <div className="panel-card" style={{ boxShadow: "none", background: "var(--bg-card)", margin: 0 }}>
                <h3 className="panel-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Current Standings</h3>
                <table className="stat-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", width: "50%" }}>Player</th>
                      <th style={{ textAlign: "center", width: "25%" }}>Record</th>
                      <th style={{ textAlign: "right", width: "25%" }}>Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endGameSummary.map((p, index) => (
                      <tr key={p.name}>
                        <td style={{ fontWeight: 700, color: "var(--charcoal-dark)" }}>#{index + 1} {p.name}</td>
                        <td style={{ textAlign: "center", fontWeight: 600, color: "var(--charcoal-dark)" }}>{p.wins}W - {p.losses}L</td>
                        <td style={{ textAlign: "right" }}><span className="badge-winrate">{p.rate}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 900, color: "var(--charcoal-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  📜 Match Feed ({sessionLogs.length})
                </h4>
                <div className="history-sidebar-box">
                  {sessionLogs.map((log) => (
                    <div key={log.id} className="history-log-card">
                      <div style={{ fontWeight: 800, color: "#1f211e" }}>🏆 {log.winners.join(" & ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-text-muted)", marginTop: "0.2rem" }}>Defeated: {log.losers.join(" & ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <button className="btn-primary" style={{ backgroundColor: "var(--gray-border)", color: "var(--charcoal-dark)", boxShadow: "4px 4px 0px var(--charcoal-dark)" }} onClick={() => setEndGameSummary(null)}>⬅️ Keep Playing</button>
              <button className="btn-primary" style={{ backgroundColor: "var(--optic-yellow)", color: "var(--charcoal-dark)", boxShadow: "4px 4px 0px #000" }} onClick={handleConfirmCloseSession}>💾 Save Session to Recents</button>
            </div>
          </div>
        </div>
      )}

      {/* LOOKUP PAST ARCHIVED ENTRIES MODAL */}
      {selectedArchivedSession && (
        <div className="end-session-overlay">
          <div className="end-session-modal-card" style={{ maxWidth: "900px" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <span style={{ fontSize: "3rem" }}>📚</span>
              <h1 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "2rem", margin: "0.5rem 0 0 0", color: "var(--charcoal-dark)" }}>{selectedArchivedSession.title}</h1>
              <p style={{ color: "var(--gray-text-muted)", fontSize: "0.85rem", fontWeight: 700, margin: "0.25rem 0 0 0" }}>ARCHIVED ON: {selectedArchivedSession.date} at {selectedArchivedSession.time}</p>
            </div>

            <div className="end-session-layout-wrapper">
              <div className="panel-card" style={{ boxShadow: "none", background: "var(--bg-card)", margin: 0 }}>
                <h3 className="panel-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Tournament Ranks</h3>
                <table className="stat-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", width: "50%" }}>Player</th>
                      <th style={{ textAlign: "center", width: "25%" }}>Record</th>
                      <th style={{ textAlign: "right", width: "25%" }}>Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArchivedSession.standings.map((p, index) => (
                      <tr key={p.name}>
                        <td style={{ fontWeight: 700, color: "var(--charcoal-dark)" }}>#{index + 1} {p.name}</td>
                        <td style={{ textAlign: "center", fontWeight: 600, color: "var(--charcoal-dark)" }}>{p.wins}W - {p.losses}L</td>
                        <td style={{ textAlign: "right" }}><span className="badge-winrate">{p.rate}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 900, color: "var(--charcoal-dark)", textTransform: "uppercase" }}>
                  Games Logged ({selectedArchivedSession.matches.length})
                </h4>
                <div className="history-sidebar-box">
                  {selectedArchivedSession.matches.map((log) => (
                    <div key={log.id} className="history-log-card">
                      <div style={{ fontWeight: 800, color: "#1f211e" }}>🏆 {log.winners.join(" & ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-text-muted)", marginTop: "0.2rem" }}>Defeated: {log.losers.join(" & ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn-primary" style={{ backgroundColor: "var(--charcoal-dark)", color: "var(--optic-yellow)", boxShadow: "4px 4px 0px #000" }} onClick={() => setSelectedArchivedSession(null)}>
              Dismiss Archive View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
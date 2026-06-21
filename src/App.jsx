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

  useEffect(() => {
    localStorage.setItem("dinka_players", JSON.stringify(players));
    localStorage.setItem("dinka_generalQueue", JSON.stringify(generalQueue));
    localStorage.setItem("dinka_winnersQueue", JSON.stringify(winnersQueue));
    localStorage.setItem("dinka_losersQueue", JSON.stringify(losersQueue));
  }, [players, generalQueue, winnersQueue, losersQueue]);

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
      console.error("Camera error: ", err);
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

  const handleShufflePool = () => {
    setGeneralQueue((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const triggerNextAutomatedMatch = () => {
    if (court.status === "Occupied") return;

    let team1 = [];
    let team2 = [];

    if (generalQueue.length >= 4) {
      team1 = [generalQueue[0], generalQueue[1]];
      team2 = [generalQueue[2], generalQueue[3]];
      setGeneralQueue((prev) => prev.slice(4));
      setCourt({ ...court, status: "Occupied", team1, team2 });
      return;
    }

    if (nextStreamType === "winners") {
      if (winnersQueue.length >= 4) {
        team1 = [winnersQueue[0], winnersQueue[1]];
        team2 = [winnersQueue[2], winnersQueue[3]];
        setWinnersQueue((prev) => prev.slice(4));
        setNextStreamType("losers");
      } else if (losersQueue.length >= 4) {
        team1 = [losersQueue[0], losersQueue[1]];
        team2 = [losersQueue[2], losersQueue[3]];
        setLosersQueue((prev) => prev.slice(4));
      } else {
        alert("Not enough players in rotation lines yet. Complete active matches!");
        return;
      }
    } else {
      if (losersQueue.length >= 4) {
        team1 = [losersQueue[0], losersQueue[1]];
        team2 = [losersQueue[2], losersQueue[3]];
        setLosersQueue((prev) => prev.slice(4));
        setNextStreamType("winners");
      } else if (winnersQueue.length >= 4) {
        team1 = [winnersQueue[0], winnersQueue[1]];
        team2 = [winnersQueue[2], winnersQueue[3]];
        setWinnersQueue((prev) => prev.slice(4));
      } else {
        alert("Not enough players in rotation lines yet. Complete active matches!");
        return;
      }
    }

    setCourt({ ...court, status: "Occupied", team1, team2 });
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
    localStorage.clear();
    setPlayers({});
    setGeneralQueue([]);
    setWinnersQueue([]);
    setLosersQueue([]);
    setNextStreamType("winners");
    setEndGameSummary(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.65rem", letterSpacing: "-0.5px" }}>⚡ dinka ni o</h1>
          <button onClick={handleTriggerEndSession} className="btn-primary" style={{ width: "auto", padding: "0.5rem 1rem", boxShadow: "3px 3px 0px var(--charcoal-dark)" }}>
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
            {generalQueue.length > 0 && <button onClick={handleShufflePool} className="btn-primary" style={{ marginTop: "1rem", backgroundColor: "var(--gray-border)", boxShadow: "none", color: "var(--charcoal-dark)" }}>🎲 Shuffle Waiting Pool</button>}
          </div>

          <div className="panel-card">
            <h2 className="panel-title">Standings & Placings</h2>
            <Leaderboard players={players} />
          </div>
        </div>

        <div className="main-column">
          <div className="panel-card">
            <h2 className="panel-title">Live Arena Progress</h2>
            <CourtGrid court={court} playersData={players} generalCount={generalQueue.length} winnersCount={winnersQueue.length} losersCount={losersQueue.length} nextStreamType={nextStreamType} onLaunchNext={triggerNextAutomatedMatch} onResolve={handleResolveMatch} />
          </div>

          <div className="panel-card">
            <h2 className="panel-title">Rotation Pipelines</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <QueueSection title="1. Fresh Waiting Pool" queueData={generalQueue} playersData={players} tagColor="var(--charcoal-dark)" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <QueueSection title="2. Winners Line" queueData={winnersQueue} playersData={players} tagColor="var(--optic-yellow)" />
                <QueueSection title="3. Losers Line" queueData={losersQueue} playersData={players} tagColor="var(--gray-border)" />
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {endGameSummary && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--bg-secondary)", display: "flex", flexDirection: "column", zIndex: 2000, overflowY: "auto", padding: "2rem 1rem" }}>
          <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <span style={{ fontSize: "3.5rem" }}>🏁</span>
              <h1 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "2.25rem", margin: "0.5rem 0 0 0" }}>Session Concluded</h1>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "1rem", marginBottom: "3rem", background: "var(--gray-bg-muted)", padding: "2rem 1rem", borderRadius: "12px", border: "1px solid var(--gray-border)" }}>
              {endGameSummary[1] && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100px" }}>
                  {endGameSummary[1].image ? <img src={endGameSummary[1].image} alt="" style={{ width: "55px", height: "55px", borderRadius: "50%", objectFit: "cover", border: "3px solid #b0b0b0" }} /> : <div style={{ width: "55px", height: "55px", borderRadius: "50%", backgroundColor: "#b0b0b0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>🥈</div>}
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", marginTop: "0.4rem" }}>{endGameSummary[1].name}</span>
                  <div style={{ backgroundColor: "#b0b0b0", color: "white", fontWeight: 900, width: "100%", textAlign: "center", padding: "0.5rem 0", borderRadius: "4px 4px 0 0", marginTop: "0.5rem", fontSize: "0.8rem" }}>#2 Silver</div>
                </div>
              )}
              {endGameSummary[0] && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "120px" }}>
                  {endGameSummary[0].image ? <img src={endGameSummary[0].image} alt="" style={{ width: "75px", height: "75px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--optic-yellow)" }} /> : <div style={{ width: "75px", height: "75px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "var(--optic-yellow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.5rem" }}>👑</div>}
                  <span style={{ fontWeight: 900, fontSize: "1rem", marginTop: "0.4rem" }}>{endGameSummary[0].name}</span>
                  <div style={{ backgroundColor: "var(--charcoal-dark)", color: "var(--optic-yellow)", fontWeight: 900, width: "100%", textAlign: "center", padding: "1rem 0", borderRadius: "6px 6px 0 0", marginTop: "0.5rem", fontSize: "0.95rem" }}>#1 Gold</div>
                </div>
              )}
              {endGameSummary[2] && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100px" }}>
                  {endGameSummary[2].image ? <img src={endGameSummary[2].image} alt="" style={{ width: "55px", height: "55px", borderRadius: "50%", objectFit: "cover", border: "3px solid #cd7f32" }} /> : <div style={{ width: "55px", height: "55px", borderRadius: "50%", backgroundColor: "#cd7f32", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>🥉</div>}
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", marginTop: "0.4rem" }}>{endGameSummary[2].name}</span>
                  <div style={{ backgroundColor: "#cd7f32", color: "white", fontWeight: 900, width: "100%", textAlign: "center", padding: "0.35rem 0", borderRadius: "4px 4px 0 0", marginTop: "0.5rem", fontSize: "0.75rem" }}>#3 Bronze</div>
                </div>
              )}
            </div>

            <div className="panel-card" style={{ marginBottom: "2rem" }}>
              <h3 className="panel-title">Final Standings</h3>
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th style={{ textAlign: "center" }}>Matches</th>
                    <th style={{ textAlign: "center" }}>Record</th>
                    <th style={{ textAlign: "right" }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {endGameSummary.map((p, index) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 700 }}>#{index + 1} {p.name}</td>
                      <td style={{ textAlign: "center", color: "var(--gray-text-muted)" }}>{p.total}</td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{p.wins}W - {p.losses}L</td>
                      <td style={{ textAlign: "right" }}><span className="badge-winrate">{p.rate}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <button className="btn-primary" style={{ backgroundColor: "var(--gray-border)", color: "var(--charcoal-dark)", boxShadow: "none" }} onClick={() => setEndGameSummary(null)}>⬅️ Back to Board</button>
              <button className="btn-primary" style={{ backgroundColor: "#ff3b30", color: "white", borderColor: "#cc2e24", boxShadow: "none" }} onClick={handleConfirmCloseSession}>❌ Close & Purge Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
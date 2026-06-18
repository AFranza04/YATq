import { useState, useRef } from "react";
import "./App.css";
import QueueSection from "./QueueSection";
import CourtGrid from "./CourtGrid";
import Leaderboard from "./Leaderboard";

const INITIAL_COURT = { id: 1, name: "Main Stadium Court", status: "Available", team1: null, team2: null };

export default function App() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [playerImage, setPlayerImage] = useState(null); 
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [players, setPlayers] = useState({});
  const [generalQueue, setGeneralQueue] = useState([]);
  const [winnersQueue, setWinnersQueue] = useState([]);
  const [losersQueue, setLosersQueue] = useState([]);
  const [court, setCourt] = useState(INITIAL_COURT);
  const [isCourtVisible] = useState(true);
  const [winningMatchResult, setWinningMatchResult] = useState(null);

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
      console.error("Error accessing webcam: ", err);
      alert("Could not access camera.");
      setIsCameraActive(false);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    // MIRROR MECHANIC FOR CANVAS: 
    // Move the orientation origin to the right edge, then flip horizontally
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setPlayerImage(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

const handleAddPlayer = (e) => {
  e.preventDefault();
  const name = newPlayerName.trim();
  
  // CRITICAL GUARD: If the name is empty OR already exists in our player object, stop right here!
  if (!name || players[name]) {
    alert("This player name is already registered or playing!");
    return; 
  }

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

  const handleAssignFromQueue = (streamType) => {
    let team1 = [];
    let team2 = [];

    if (streamType === "general") {
      if (generalQueue.length < 4) return;
      team1 = [generalQueue[0], generalQueue[1]];
      team2 = [generalQueue[2], generalQueue[3]];
      setGeneralQueue((prev) => prev.slice(4));
    } else if (streamType === "winners") {
      if (winnersQueue.length < 4) return;
      team1 = [winnersQueue[0], winnersQueue[1]];
      team2 = [winnersQueue[2], winnersQueue[3]];
      setWinnersQueue((prev) => prev.slice(4));
    } else if (streamType === "losers") {
      if (losersQueue.length < 4) return;
      team1 = [losersQueue[0], losersQueue[1]];
      team2 = [losersQueue[2], losersQueue[3]];
      setLosersQueue((prev) => prev.slice(4));
    }

    setCourt({ ...court, status: "Occupied", team1, team2 });
  };

  const handleResolveMatch = (winningTeam, losingTeam) => {
    // Correctly update individual statistics without mutating inner state objects
    setPlayers((prev) => {
      const updated = { ...prev };

      winningTeam.forEach((p) => {
        if (updated[p]) {
          updated[p] = {
            ...updated[p],
            wins: updated[p].wins + 1 // Pure addition, safe from StrictMode double runs
          };
        }
      });

      losingTeam.forEach((p) => {
        if (updated[p]) {
          updated[p] = {
            ...updated[p],
            losses: updated[p].losses + 1
          };
        }
      });

      return updated;
    });

    // Feed separate rotation streams
    setWinnersQueue((prev) => [...prev, ...winningTeam]);
    setLosersQueue((prev) => [...prev, ...losingTeam]);
    setWinningMatchResult(winningTeam);
    setCourt(INITIAL_COURT);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.65rem", letterSpacing: "-0.5px" }}>YATq</h1>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "1.5px", color: "var(--optic-yellow)" }}>may vs banga</span>
        </div>
      </header>

      <main className="dashboard-grid">
        <div className="main-column">
          <div className="panel-card">
            <h2 className="panel-title">Player Sign-Up</h2>
            <form onSubmit={handleAddPlayer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                required
              />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", background: "var(--gray-bg-muted)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--gray-border)" }}>
                {isCameraActive && (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    /* MIRROR MECHANIC FOR LIVE PREVIEW */
                    style={{ width: "100%", maxWidth: "200px", height: "200px", objectFit: "cover", borderRadius: "50%", border: "3px solid var(--charcoal-dark)", transform: "scaleX(-1)" }} 
                  />
                )}
                {playerImage && (
                  <img src={playerImage} alt="" style={{ width: "200px", height: "200px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--charcoal-dark)" }} />
                )}
                <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                  {!isCameraActive ? (
                    <button type="button" onClick={startCamera} className="btn-score-win" style={{ width: "100%" }}>📸 Open Camera</button>
                  ) : (
                    <button type="button" onClick={captureSnapshot} className="btn-score-win" style={{ width: "100%", backgroundColor: "var(--optic-yellow)" }}>🎯 Capture</button>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary">Add Player</button>
            </form>
            
            {generalQueue.length > 0 && (
              <button onClick={handleShufflePool} className="btn-primary" style={{ marginTop: "1rem", backgroundColor: "var(--gray-border)", boxShadow: "none", color: "var(--charcoal-dark)" }}>
                🎲 Shuffle Waiting Pool
              </button>
            )}
          </div>

          <div className="panel-card">
            <h2 className="panel-title">Leaderboard Standings</h2>
            <Leaderboard players={players} />
          </div>
        </div>

        <div className="main-column">
          {isCourtVisible && (
            <div className="panel-card">
              <h2 className="panel-title">Live Arena Progress</h2>
              <CourtGrid 
                court={court} 
                playersData={players}
                generalCount={generalQueue.length}
                winnersCount={winnersQueue.length}
                losersCount={losersQueue.length}
                onAssign={handleAssignFromQueue}
                onResolve={handleResolveMatch}
              />
            </div>
          )}

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
          <div className="panel-card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", border: "3px solid var(--charcoal-dark)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <span style={{ fontSize: "3rem" }}>🏆</span>
            <h2 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "1.75rem", margin: "0.5rem 0" }}>Winners Bracket Advanced!</h2>
            <p style={{ color: "var(--gray-text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>These players dominated the stadium and are holding the court track line.</p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem" }}>
              {winningMatchResult.map((name) => {
                const p = players[name];
                return (
                  <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    {p?.image ? (
                      <img src={p.image} alt="" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--optic-yellow)" }} />
                    ) : (
                      <div style={{ width: "90px", height: "90px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", border: "4px solid var(--optic-yellow)" }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{name}</span>
                  </div>
                );
              })}
            </div>

            <button className="btn-primary" onClick={() => setWinningMatchResult(null)}>
              Dismiss Bracket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
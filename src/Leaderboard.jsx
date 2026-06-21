export default function Leaderboard({ players, onDeletePlayer }) {
  const dataset = Object.values(players).map((p) => {
    const total = p.wins + p.losses;
    const rate = total > 0 ? ((p.wins / total) * 100).toFixed(0) : 0;
    return { ...p, rate: Number(rate) };
  }).sort((a, b) => b.rate - a.rate || b.wins - a.wins);

  return (
    <div>
      <table className="stat-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Rank & Player</th>
            <th style={{ textAlign: "center" }}>W - L</th>
            <th style={{ textAlign: "right" }}>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {dataset.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", color: "#6c7263", fontSize: "0.85rem", paddingTop: "1rem" }}>
                No records found.
              </td>
            </tr>
          ) : (
            dataset.map((player, index) => (
              <tr key={player.name}>
                <td style={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="rank-badge">#{index + 1}</span>
                    {player.image ? (
                      <img src={player.image} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", marginRight: "0.5rem" }} />
                    ) : (
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "bold", marginRight: "0.5rem" }}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{player.name}</span>
                  </div>
                  {/* Action Delete Button */}
                  <button 
                    onClick={() => onDeletePlayer(player.name)} 
                    style={{ background: "none", border: "none", color: "#ff3b30", cursor: "pointer", fontSize: "0.85rem", marginLeft: "0.5rem", padding: "0 0.25rem" }}
                    title="Remove Player"
                  >
                    ❌
                  </button>
                </td>
                <td style={{ textAlign: "center", color: "var(--gray-text-muted)", fontWeight: 600 }}>
                  {player.wins} - {player.losses}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span className="badge-winrate">{player.rate}%</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export default function QueueSection({ title, queueData, playersData, tagColor, onDeletePlayer, showDelete = false }) {
  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title} ({queueData.length})
      </h4>
      <div className="queue-box" style={{ maxHeight: "220px", overflowY: "auto" }}>
        {queueData.length === 0 ? (
          <span style={{ fontSize: "0.8rem", color: "var(--gray-text-muted)", fontStyle: "italic" }}>Empty line...</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {queueData.map((playerName, idx) => {
              const playerData = playersData[playerName];
              return (
                <div key={idx} className="queue-item" style={{ borderLeft: `4px solid ${tagColor}`, margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {playerData?.image ? (
                      <img src={playerData.image} alt={playerName} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--charcoal-dark)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>
                        {playerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{playerName}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-text-muted)" }}>#{idx + 1}</span>
                    {showDelete && (
                      <button 
                        onClick={() => onDeletePlayer(playerName)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";

// ── Tailwind note: using inline styles + utility classes together ──

const SETS = [
  { id: "sv8", name: "Surging Sparks", total: 191, series: "Scarlet & Violet" },
  { id: "sv7", name: "Stellar Crown", total: 175, series: "Scarlet & Violet" },
  { id: "sv6pt5", name: "Shrouded Fable", total: 99, series: "Scarlet & Violet" },
  { id: "sv6", name: "Twilight Masquerade", total: 167, series: "Scarlet & Violet" },
  { id: "sv5", name: "Temporal Forces", total: 162, series: "Scarlet & Violet" },
  { id: "sv4pt5", name: "Paldean Fates", total: 245, series: "Scarlet & Violet" },
  { id: "sv4", name: "Paradox Rift", total: 182, series: "Scarlet & Violet" },
  { id: "sv3pt5", name: "151", total: 207, series: "Scarlet & Violet" },
  { id: "sv3", name: "Obsidian Flames", total: 197, series: "Scarlet & Violet" },
  { id: "sv2", name: "Paldea Evolved", total: 193, series: "Scarlet & Violet" },
  { id: "sv1", name: "Scarlet & Violet Base", total: 198, series: "Scarlet & Violet" },
  { id: "swsh12pt5", name: "Crown Zenith", total: 159, series: "Sword & Shield" },
  { id: "swsh12", name: "Silver Tempest", total: 195, series: "Sword & Shield" },
  { id: "swsh11", name: "Lost Origin", total: 196, series: "Sword & Shield" },
  { id: "swsh10", name: "Astral Radiance", total: 189, series: "Sword & Shield" },
  { id: "cel25", name: "Celebrations", total: 50, series: "Sword & Shield" },
  { id: "swsh9", name: "Brilliant Stars", total: 172, series: "Sword & Shield" },
  { id: "swsh8", name: "Fusion Strike", total: 264, series: "Sword & Shield" },
  { id: "swsh7", name: "Evolving Skies", total: 203, series: "Sword & Shield" },
  { id: "swsh6", name: "Chilling Reign", total: 198, series: "Sword & Shield" },
  { id: "swsh5", name: "Battle Styles", total: 163, series: "Sword & Shield" },
  { id: "swsh4", name: "Vivid Voltage", total: 185, series: "Sword & Shield" },
  { id: "swsh3", name: "Darkness Ablaze", total: 185, series: "Sword & Shield" },
  { id: "swsh2", name: "Rebel Clash", total: 192, series: "Sword & Shield" },
  { id: "swsh1", name: "Sword & Shield Base", total: 202, series: "Sword & Shield" },
];

const SERIES_COLORS = {
  "Scarlet & Violet": { bg: "#FF4444", accent: "#FF8800", light: "#FFF0F0" },
  "Sword & Shield": { bg: "#5B8AFF", accent: "#00C8FF", light: "#F0F4FF" },
  "Sun & Moon": { bg: "#FF9500", accent: "#FFD700", light: "#FFF8E0" },
  "XY": { bg: "#22BB66", accent: "#00FFAA", light: "#F0FFF6" },
};

const RARITY_ICONS = {
  "Common": "○", "Uncommon": "◇", "Rare": "★", "Rare Holo": "★✦",
  "Rare Ultra": "◆◆", "Rare Secret": "◆◆◆", "Promo": "🏆", "": "?",
};

// ── Storage helpers ──
const STORAGE_KEY = "pokecollection_v2";
function loadCollection() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveCollection(col) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(col));
}

// ── Pokémon TCG API ──
async function searchCards(query, setId = "") {
  const params = new URLSearchParams();
  const q = [];
  if (query) q.push(`name:"${query}*"`);
  if (setId) q.push(`set.id:${setId}`);
  params.set("q", q.join(" ") || "name:*");
  params.set("pageSize", "30");
  params.set("select", "id,name,number,set,rarity,images,supertype,subtypes");
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?${params}`);
  const data = await res.json();
  return data.data || [];
}

// ── Mini components ──
function PokeballIcon({ size = 24, spinning = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}>
      <circle cx="50" cy="50" r="48" fill="#FF3333" stroke="#222" strokeWidth="4" />
      <rect x="2" y="46" width="96" height="8" fill="#222" />
      <circle cx="50" cy="50" r="14" fill="white" stroke="#222" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" fill="#FF3333" stroke="#222" strokeWidth="2" />
      <path d="M2 50 A48 48 0 0 1 98 50" fill="white" stroke="none" />
    </svg>
  );
}

function SetProgressBar({ collected, total, color }) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 3 }}>
        <span>{collected}/{total} cards</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: "#E8E8E8", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color,
          borderRadius: 99, transition: "width 0.6s ease",
          boxShadow: `0 0 6px ${color}88`
        }} />
      </div>
    </div>
  );
}

function CardTile({ card, owned, variants, onToggle }) {
  const [flipped, setFlipped] = useState(false);
  const ownedCount = variants ? variants.length : (owned ? 1 : 0);

  return (
    <div onClick={() => onToggle(card)} style={{
      position: "relative", cursor: "pointer", borderRadius: 12,
      overflow: "hidden", border: ownedCount > 0 ? "3px solid #FFD700" : "3px solid #DDD",
      background: ownedCount > 0 ? "#FFFBEA" : "#F5F5F5",
      transition: "transform 0.15s, box-shadow 0.15s",
      boxShadow: ownedCount > 0 ? "0 4px 16px #FFD70066" : "0 2px 6px #00000020",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px) scale(1.03)"}
      onMouseLeave={e => e.currentTarget.style.transform = ""}
    >
      {card.images?.small
        ? <img src={card.images.small} alt={card.name} style={{ width: "100%", display: "block" }} loading="lazy" />
        : <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#AAA", padding: 8, textAlign: "center" }}>
            <span>{card.name}</span>
          </div>
      }
      <div style={{ padding: "6px 8px", background: "white" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
        <div style={{ fontSize: 10, color: "#888" }}>#{card.number} · {card.rarity || "?"}</div>
      </div>
      {ownedCount > 0 && (
        <div style={{
          position: "absolute", top: 6, right: 6, background: "#FFD700",
          color: "#222", borderRadius: 99, width: 22, height: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, boxShadow: "0 2px 6px #00000040"
        }}>
          {ownedCount > 1 ? ownedCount : "✓"}
        </div>
      )}
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [tab, setTab] = useState("browse"); // browse | sets | collection
  const [collection, setCollection] = useState(loadCollection);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState("Scarlet & Violet");
  const searchRef = useRef();
  const debounceRef = useRef();

  // Persist
  useEffect(() => { saveCollection(collection); }, [collection]);

  // Toast
  const showToast = (msg, color = "#FFD700") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2000);
  };

  // Search
  const doSearch = useCallback(async (q, setId) => {
    if (!q && !setId) { setCards([]); return; }
    setLoading(true);
    try {
      const res = await searchCards(q, setId);
      setCards(res);
    } catch { setCards([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery, selectedSet), 500);
  }, [searchQuery, selectedSet, doSearch]);

  // Toggle card ownership
  const toggleCard = (card) => {
    setCollection(prev => {
      const next = { ...prev };
      if (next[card.id]) {
        delete next[card.id];
        showToast(`Removed ${card.name}`, "#FF6666");
      } else {
        next[card.id] = { id: card.id, name: card.name, set: card.set?.id, number: card.number, rarity: card.rarity, added: Date.now() };
        showToast(`Added ${card.name}! ✓`, "#44CC44");
      }
      return next;
    });
  };

  // Stats
  const totalOwned = Object.keys(collection).length;
  const setStats = SETS.map(s => {
    const owned = Object.values(collection).filter(c => c.set === s.id).length;
    return { ...s, owned };
  });

  const seriesList = [...new Set(SETS.map(s => s.series))];

  // ── My Collection tab cards ──
  const myCards = Object.values(collection).sort((a, b) => (a.name > b.name ? 1 : -1));

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'Nunito', 'Trebuchet MS', sans-serif",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      color: "#FFF", maxWidth: 480, margin: "0 auto", position: "relative",
      boxShadow: "0 0 60px #00000080"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Bangers&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ffffff30; border-radius: 4px; }
        input::placeholder { color: #aaa; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #FF4444, #FF8800)",
        padding: "20px 20px 16px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px #FF444466"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PokeballIcon size={36} />
          <div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: 26, letterSpacing: 2, lineHeight: 1 }}>
              PokéDex Collector
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
              {totalOwned} card{totalOwned !== 1 ? "s" : ""} collected
            </div>
          </div>
        </div>

        {/* Search bar (only on browse tab) */}
        {tab === "browse" && (
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Pokémon cards…"
                style={{
                  width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12,
                  border: "none", fontSize: 14, background: "#FFFFFF22",
                  color: "white", outline: "none", boxSizing: "border-box",
                  backdropFilter: "blur(8px)"
                }}
              />
            </div>
            <select value={selectedSet} onChange={e => setSelectedSet(e.target.value)} style={{
              padding: "8px 10px", borderRadius: 12, border: "none", fontSize: 12,
              background: "#FFFFFF22", color: "white", outline: "none", maxWidth: 110,
              backdropFilter: "blur(8px)"
            }}>
              <option value="">All Sets</option>
              {SETS.map(s => <option key={s.id} value={s.id} style={{ background: "#222" }}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", background: "#00000040", borderBottom: "1px solid #ffffff15",
        position: "sticky", top: tab === "browse" ? 110 : 72, zIndex: 99
      }}>
        {[
          { id: "browse", label: "🔍 Browse" },
          { id: "sets", label: "📦 Sets" },
          { id: "collection", label: "⭐ My Cards" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 4px", border: "none", background: "transparent",
            color: tab === t.id ? "#FFD700" : "#FFFFFF88", cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 12,
            borderBottom: tab === t.id ? "3px solid #FFD700" : "3px solid transparent",
            transition: "all 0.2s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 100px" }}>

        {/* ── BROWSE TAB ── */}
        {tab === "browse" && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 40, flexDirection: "column", alignItems: "center", gap: 12 }}>
                <PokeballIcon size={48} spinning />
                <div style={{ opacity: 0.7, fontWeight: 700 }}>Searching…</div>
              </div>
            )}
            {!loading && cards.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
                <div style={{ fontSize: 48 }}>🎴</div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>Search for a Pokémon card above!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try "Pikachu" or "Charizard"</div>
              </div>
            )}
            {!loading && cards.length > 0 && (
              <>
                <div style={{ fontSize: 12, color: "#FFD700", fontWeight: 700, marginBottom: 12 }}>
                  {cards.length} card{cards.length !== 1 ? "s" : ""} found
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {cards.map(card => (
                    <CardTile
                      key={card.id}
                      card={card}
                      owned={!!collection[card.id]}
                      onToggle={toggleCard}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SETS TAB ── */}
        {tab === "sets" && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            {/* Series selector */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
              {seriesList.map(s => (
                <button key={s} onClick={() => setSelectedSeries(s)} style={{
                  whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 99,
                  border: "none", cursor: "pointer", fontWeight: 900, fontSize: 12,
                  fontFamily: "'Nunito', sans-serif",
                  background: selectedSeries === s ? (SERIES_COLORS[s]?.bg || "#FF4444") : "#ffffff15",
                  color: "white", transition: "all 0.2s",
                  boxShadow: selectedSeries === s ? `0 0 12px ${SERIES_COLORS[s]?.bg || "#FF444488"}` : "none"
                }}>{s}</button>
              ))}
            </div>

            {/* Set cards */}
            {setStats.filter(s => s.series === selectedSeries).map(s => {
              const colors = SERIES_COLORS[s.series] || SERIES_COLORS["XY"];
              const pct = Math.round((s.owned / s.total) * 100);
              return (
                <div key={s.id} onClick={() => { setSelectedSet(s.id); setTab("browse"); doSearch("", s.id); }}
                  style={{
                    background: "#ffffff0d", borderRadius: 16, padding: "14px 16px",
                    marginBottom: 10, cursor: "pointer", border: "1px solid #ffffff15",
                    transition: "all 0.2s",
                    ...(s.owned > 0 ? { borderColor: colors.bg + "66" } : {})
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffffff18"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ffffff0d"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#FFFFFF77", marginTop: 2 }}>{s.series}</div>
                    </div>
                    {pct === 100 && <span style={{ fontSize: 20 }}>🏆</span>}
                    {pct >= 50 && pct < 100 && <span style={{ fontSize: 20 }}>⭐</span>}
                  </div>
                  <SetProgressBar collected={s.owned} total={s.total} color={colors.bg} />
                </div>
              );
            })}

            {/* Overall stats */}
            <div style={{
              marginTop: 20, background: "linear-gradient(135deg, #FFD700, #FF8800)",
              borderRadius: 16, padding: "16px 20px", color: "#222"
            }}>
              <div style={{ fontFamily: "'Bangers', cursive", fontSize: 20, letterSpacing: 1 }}>📊 Overall Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                {[
                  { label: "Total Cards Owned", val: totalOwned },
                  { label: "Sets Started", val: setStats.filter(s => s.owned > 0).length },
                  { label: "Sets Completed", val: setStats.filter(s => s.owned >= s.total && s.total > 0).length },
                  { label: "Total Sets", val: SETS.length },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#00000015", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 900, fontSize: 22 }}>{stat.val}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MY COLLECTION TAB ── */}
        {tab === "collection" && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            {myCards.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
                <div style={{ fontSize: 56 }}>📭</div>
                <div style={{ fontWeight: 900, fontSize: 18, marginTop: 8 }}>No cards yet!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Go to Browse to add cards to your collection.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "#FFD700", fontWeight: 700, marginBottom: 12 }}>
                  {myCards.length} card{myCards.length !== 1 ? "s" : ""} in collection
                </div>
                {/* Group by set */}
                {SETS.filter(s => myCards.some(c => c.set === s.id)).map(s => {
                  const setCards = myCards.filter(c => c.set === s.id).sort((a, b) => Number(a.number) - Number(b.number));
                  const colors = SERIES_COLORS[s.series] || SERIES_COLORS["XY"];
                  return (
                    <div key={s.id} style={{ marginBottom: 24 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                        borderLeft: `4px solid ${colors.bg}`, paddingLeft: 10
                      }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "#FFFFFF66" }}>{setCards.length} card{setCards.length !== 1 ? "s" : ""} owned</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {setCards.map(card => (
                          <div key={card.id} onClick={() => {
                            setCollection(prev => { const next = { ...prev }; delete next[card.id]; return next; });
                            showToast(`Removed ${card.name}`, "#FF6666");
                          }} style={{
                            background: "#ffffff10", borderRadius: 10, padding: 10,
                            cursor: "pointer", border: "1px solid #FFD70033", textAlign: "center",
                            transition: "all 0.15s"
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = "#FF444422"}
                            onMouseLeave={e => e.currentTarget.style.background = "#ffffff10"}
                          >
                            <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.2 }}>{card.name}</div>
                            <div style={{ fontSize: 10, color: "#FFFFFF77", marginTop: 3 }}>#{card.number}</div>
                            <div style={{ fontSize: 9, color: "#FFD700", marginTop: 2 }}>{card.rarity || "?"}</div>
                            <div style={{ fontSize: 9, color: "#FF6666", marginTop: 6, fontWeight: 700 }}>tap to remove</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Misc cards (no set match) */}
                {myCards.filter(c => !SETS.find(s => s.id === c.set)).length > 0 && (
                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 8, borderLeft: "4px solid #888", paddingLeft: 10 }}>Other</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {myCards.filter(c => !SETS.find(s => s.id === c.set)).map(card => (
                        <div key={card.id} onClick={() => {
                          setCollection(prev => { const next = { ...prev }; delete next[card.id]; return next; });
                        }} style={{
                          background: "#ffffff10", borderRadius: 10, padding: 10, cursor: "pointer", textAlign: "center"
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 900 }}>{card.name}</div>
                          <div style={{ fontSize: 10, color: "#FFFFFF77" }}>#{card.number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "#222", borderRadius: 99,
          padding: "10px 20px", fontWeight: 900, fontSize: 14,
          boxShadow: "0 4px 20px #00000060", zIndex: 999,
          animation: "pop 0.3s ease", whiteSpace: "nowrap"
        }}>{toast.msg}</div>
      )}

      {/* Bottom safe area */}
      <div style={{ height: 20 }} />
    </div>
  );
}

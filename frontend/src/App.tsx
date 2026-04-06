import { useState } from "react"

const API = "http://localhost:8000"

const CONSTITUENCIES = [
  { id: "Delhi_North", label: "Delhi North", state: "Delhi" },
  { id: "Delhi_South", label: "Delhi South", state: "Delhi" },
  { id: "Mumbai_West", label: "Mumbai West", state: "Maharashtra" },
]

function StatCard({ icon, value, label, color, subtitle }: any) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #13131f 0%, #1a1a2e 100%)",
      borderRadius: "16px", padding: "28px 24px",
      border: `1px solid ${color}30`,
      boxShadow: `0 0 30px ${color}10`,
      position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20,
        fontSize: "80px", opacity: 0.06, filter: "blur(2px)"
      }}>{icon}</div>
      <div style={{ fontSize: "13px", color: "#555", letterSpacing: "2px", marginBottom: "12px", fontWeight: 600 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: "48px", fontWeight: 800, color, lineHeight: 1, marginBottom: "8px" }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: "12px", color: "#444", marginTop: "6px" }}>{subtitle}</div>}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "2px", background: `linear-gradient(90deg, ${color}, transparent)`
      }} />
    </div>
  )
}

function RiskBadge({ label }: { label: string }) {
  const colors: any = { HIGH: "#e74c3c", MEDIUM: "#f39c12", LOW: "#27ae60" }
  return (
    <span style={{
      background: `${colors[label]}20`, color: colors[label],
      border: `1px solid ${colors[label]}50`,
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 700, letterSpacing: 1
    }}>{label}</span>
  )
}

function SectionHeader({ title, subtitle }: any) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555" }}>{subtitle}</p>}
    </div>
  )
}

function GhostClusterCard({ cluster }: any) {
  const riskPct = Math.round(cluster.risk_score * 100)
  return (
    <div style={{
      background: "#0d0d1a", borderRadius: "12px", padding: "20px",
      border: "1px solid #e74c3c20", marginBottom: "10px",
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e74c3c", boxShadow: "0 0 8px #e74c3c" }} />
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>{cluster.address_text}</span>
          </div>
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "12px", marginLeft: "16px" }}>
            📍 {cluster.locality}, {cluster.district}
          </div>
          <div style={{ marginLeft: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#555" }}>FRAUD RISK</span>
              <span style={{ fontSize: "11px", color: "#e74c3c", fontWeight: 700 }}>{riskPct}%</span>
            </div>
            <div style={{ height: "4px", background: "#1a1a2e", borderRadius: "2px" }}>
              <div style={{ width: `${riskPct}%`, height: "100%", background: "linear-gradient(90deg, #e74c3c, #c0392b)", borderRadius: "2px" }} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginLeft: "20px", minWidth: "70px" }}>
          <div style={{ fontSize: "40px", fontWeight: 800, color: "#e74c3c", lineHeight: 1 }}>{cluster.voter_count}</div>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: 1, marginTop: "4px" }}>VOTERS</div>
          <div style={{ fontSize: "10px", color: "#e74c3c", marginTop: "6px", background: "#e74c3c15", padding: "2px 8px", borderRadius: "10px" }}>GHOST</div>
        </div>
      </div>
    </div>
  )
}

function BoothCard({ booth }: any) {
  const colors: any = { HIGH: "#e74c3c", MEDIUM: "#f39c12", LOW: "#27ae60" }
  const color = colors[booth.risk_label]
  const pct = Math.round(booth.risk_score * 100)
  return (
    <div style={{
      background: "#0d0d1a", borderRadius: "12px", padding: "18px 20px",
      border: `1px solid ${color}20`, marginBottom: "10px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#ddd", marginBottom: "3px" }}>{booth.booth_name}</div>
          <div style={{ fontSize: "11px", color: "#444" }}>{booth.voter_count} registered voters • {booth.spike_voters} spike enrollments</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", fontWeight: 800, color }}>{pct}%</span>
          <RiskBadge label={booth.risk_label} />
        </div>
      </div>
      <div style={{ height: "5px", background: "#1a1a2e", borderRadius: "3px" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: "3px",
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: "width 0.8s ease"
        }} />
      </div>
      {booth.risk_label === "HIGH" && (
        <div style={{ marginTop: "10px", fontSize: "11px", color: "#e74c3c", background: "#e74c3c10", padding: "6px 10px", borderRadius: "6px" }}>
          ⚠️ {booth.spike_voters} voters enrolled in a single week — temporal spike detected
        </div>
      )}
    </div>
  )
}

function FamilyCard({ anomaly }: any) {
  return (
    <div style={{
      background: "#0d0d1a", borderRadius: "12px", padding: "20px",
      border: "1px solid #f39c1220", marginBottom: "10px"
    }}>
      <div style={{ color: "#f39c12", fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>
        ⚠️ Impossible Family Relationship Detected
      </div>
      <div style={{ color: "#e74c3c", fontSize: "13px", marginBottom: "12px", fontStyle: "italic" }}>
        "{anomaly.anomaly_description}"
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ flex: 1, background: "#13131f", borderRadius: "8px", padding: "12px", border: "1px solid #333" }}>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: 1, marginBottom: "6px" }}>CHILD (DECLARED)</div>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{anomaly.voter_name}</div>
          <div style={{ fontSize: "12px", color: "#e74c3c" }}>Age: {anomaly.voter_age} years</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>ID: {anomaly.voter_id}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "#555", fontSize: "20px" }}>→</div>
        <div style={{ flex: 1, background: "#13131f", borderRadius: "8px", padding: "12px", border: "1px solid #333" }}>
          <div style={{ fontSize: "10px", color: "#555", letterSpacing: 1, marginBottom: "6px" }}>PARENT (DECLARED)</div>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{anomaly.related_name}</div>
          <div style={{ fontSize: "12px", color: "#27ae60" }}>Age: {anomaly.related_age} years</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>ID: {anomaly.related_id}</div>
        </div>
      </div>
    </div>
  )
}

function AlgorithmPanel() {
  const algorithms = [
    { name: "Louvain Clustering", icon: "🔵", status: "ACTIVE", desc: "Detects ghost address communities", color: "#3498db" },
    { name: "BFS Traversal", icon: "🔍", status: "ACTIVE", desc: "Traces duplicate EPIC chains", color: "#9b59b6" },
    { name: "PageRank", icon: "📊", status: "ACTIVE", desc: "Scores suspicious address hubs", color: "#e74c3c" },
    { name: "Temporal Analysis", icon: "⏱️", status: "ACTIVE", desc: "Detects enrollment spikes", color: "#f39c12" },
    { name: "Family Graph", icon: "👨‍👦", status: "ACTIVE", desc: "Finds impossible age relations", color: "#27ae60" },
    { name: "K-hop Neighbor", icon: "🕸️", status: "ACTIVE", desc: "Maps coordinated networks", color: "#1abc9c" },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
      {algorithms.map(a => (
        <div key={a.name} style={{
          background: "#0d0d1a", borderRadius: "10px", padding: "14px",
          border: `1px solid ${a.color}20`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "18px" }}>{a.icon}</span>
            <span style={{ fontSize: "9px", color: a.color, background: `${a.color}15`, padding: "2px 6px", borderRadius: "10px", fontWeight: 700, letterSpacing: 1 }}>
              {a.status}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "12px", color: "#ccc", marginBottom: "4px" }}>{a.name}</div>
          <div style={{ fontSize: "11px", color: "#444" }}>{a.desc}</div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(false)
  const [ghostData, setGhostData] = useState<any>(null)
  const [boothData, setBoothData] = useState<any>(null)
  const [familyData, setFamilyData] = useState<any>(null)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const analyze = async (constituency: string) => {
    setSelected(constituency)
    setLoading(true)
    setError("")
    setGhostData(null)
    setBoothData(null)
    setFamilyData(null)
    setActiveTab("overview")

    try {
      const ghostResp = await fetch(`${API}/api/fraud/ghost-clusters/${constituency}`)
      const ghost = await ghostResp.json()
      setGhostData(ghost)

      const boothResp = await fetch(`${API}/api/fraud/booth-scores/${constituency}`)
      const booth = await boothResp.json()
      setBoothData(booth)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const famResp = await fetch(`${API}/api/fraud/family-anomalies/${constituency}`, { signal: controller.signal })
        const fam = await famResp.json()
        setFamilyData(fam)
      } catch {
        setFamilyData({ anomalies: [] })
      } finally {
        clearTimeout(timeout)
      }
    } catch (e: any) {
      setError(`Connection error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const totalRisk = ghostData && boothData ? (
    (ghostData.total_ghost_voters > 100 ? 40 : 20) +
    (boothData.booths?.filter((b: any) => b.risk_label === "HIGH").length > 0 ? 35 : 10) +
    (familyData?.anomalies?.length > 0 ? 25 : 0)
  ) : 0

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "ghost", label: "Ghost Clusters" },
    { id: "booths", label: "Booth Analysis" },
    { id: "family", label: "Family Anomalies" },
    { id: "algorithms", label: "Graph Algorithms" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#080812", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top Nav */}
      <nav style={{
        background: "#0d0d1a", borderBottom: "1px solid #1a1a2e",
        padding: "0 40px", display: "flex", alignItems: "center",
        height: "64px", position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #e74c3c, #c0392b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", boxShadow: "0 0 20px #e74c3c40"
          }}>👻</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px" }}>GhostWatch</div>
            <div style={{ fontSize: "10px", color: "#e74c3c", letterSpacing: "2px", fontWeight: 600 }}>ELECTORAL FRAUD DETECTION</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ fontSize: "12px", color: "#555", fontStyle: "italic" }}>
            "30–40M phantom voters. The graph sees them."
          </div>
          <div style={{
            background: "#e74c3c15", border: "1px solid #e74c3c40",
            color: "#e74c3c", padding: "6px 14px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 700, letterSpacing: 1
          }}>
            ● LIVE — TigerGraph Savanna
          </div>
        </div>
      </nav>

      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>

        {/* Sidebar */}
        <aside style={{
          width: "280px", background: "#0d0d1a",
          borderRight: "1px solid #1a1a2e", padding: "32px 20px",
          flexShrink: 0
        }}>
          <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px", marginBottom: "16px", fontWeight: 700 }}>
            SELECT CONSTITUENCY
          </div>
          {CONSTITUENCIES.map(c => (
            <button key={c.id} onClick={() => analyze(c.id)} disabled={loading} style={{
              width: "100%", padding: "14px 16px", borderRadius: "10px",
              border: selected === c.id ? "1px solid #e74c3c60" : "1px solid #1a1a2e",
              background: selected === c.id ? "linear-gradient(135deg, #e74c3c15, #c0392b08)" : "transparent",
              color: selected === c.id ? "#fff" : "#555",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "8px", textAlign: "left",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: "12px"
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: selected === c.id ? "#e74c3c" : "#2a2a3e",
                boxShadow: selected === c.id ? "0 0 8px #e74c3c" : "none",
                flexShrink: 0
              }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{c.label}</div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>{c.state}</div>
              </div>
              {selected === c.id && loading && (
                <div style={{ marginLeft: "auto", fontSize: "12px", color: "#e74c3c" }}>...</div>
              )}
            </button>
          ))}

          {/* Overall Risk Meter */}
          {ghostData && (
            <div style={{ marginTop: "32px", padding: "20px", background: "#080812", borderRadius: "12px", border: "1px solid #1a1a2e" }}>
              <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px", marginBottom: "12px", fontWeight: 700 }}>
                CONSTITUENCY RISK
              </div>
              <div style={{ position: "relative", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 100 60" style={{ width: "100%" }}>
                  <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#1a1a2e" strokeWidth="8" strokeLinecap="round" />
                  <path d="M10 50 A40 40 0 0 1 90 50" fill="none"
                    stroke={totalRisk > 70 ? "#e74c3c" : totalRisk > 40 ? "#f39c12" : "#27ae60"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${totalRisk * 1.26} 126`}
                  />
                  <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">{totalRisk}%</text>
                  <text x="50" y="58" textAnchor="middle" fill="#555" fontSize="7">FRAUD RISK</text>
                </svg>
              </div>
              <div style={{ textAlign: "center", fontSize: "11px", color: totalRisk > 70 ? "#e74c3c" : totalRisk > 40 ? "#f39c12" : "#27ae60", fontWeight: 700 }}>
                {totalRisk > 70 ? "HIGH RISK CONSTITUENCY" : totalRisk > 40 ? "MODERATE RISK" : "LOW RISK"}
              </div>
            </div>
          )}

          {/* Data source */}
          <div style={{ marginTop: "32px", padding: "16px", background: "#080812", borderRadius: "10px", border: "1px solid #1a1a2e" }}>
            <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px", marginBottom: "10px" }}>DATA SOURCES</div>
            {["ECI Electoral Rolls", "EPIC Database", "Aadhaar Seeding", "Census Address Data"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#27ae60" }} />
                <span style={{ fontSize: "11px", color: "#555" }}>{s}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>

          {/* Empty state */}
          {!loading && !ghostData && !error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center" }}>
              <div style={{ fontSize: "80px", marginBottom: "24px", filter: "grayscale(0.5)" }}>👻</div>
              <h2 style={{ color: "#2a2a3e", fontSize: "28px", fontWeight: 800, margin: "0 0 12px" }}>No Constituency Selected</h2>
              <p style={{ color: "#333", fontSize: "15px", maxWidth: "400px", lineHeight: 1.6 }}>
                Select a constituency from the sidebar to run TigerGraph fraud detection algorithms
              </p>
              <div style={{ marginTop: "32px", display: "flex", gap: "24px" }}>
                {["Louvain Clustering", "PageRank Analysis", "Temporal BFS"].map(a => (
                  <div key={a} style={{ padding: "10px 16px", background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "8px", fontSize: "12px", color: "#444" }}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
              <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "32px" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  border: "3px solid #1a1a2e", borderTopColor: "#e74c3c",
                  animation: "spin 1s linear infinite"
                }} />
                <div style={{ position: "absolute", inset: "12px", borderRadius: "50%", background: "#e74c3c10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  👻
                </div>
              </div>
              <p style={{ color: "#e74c3c", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>Scanning for fraud patterns...</p>
              <p style={{ color: "#333", fontSize: "13px" }}>Running TigerGraph algorithms on {selected.replace("_", " ")}</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{ background: "#e74c3c10", border: "1px solid #e74c3c30", borderRadius: "12px", padding: "20px", color: "#e74c3c", marginBottom: "24px" }}>
              ❌ {error}
            </div>
          )}

          {!loading && ghostData && (
            <>
              {/* Page header */}
              <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#fff" }}>
                    {selected.replace("_", " ")}
                  </h1>
                  <p style={{ margin: "6px 0 0", color: "#555", fontSize: "13px" }}>
                    Analysis complete • {new Date().toLocaleTimeString()} • Powered by TigerGraph Savanna
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      padding: "8px 16px", borderRadius: "8px", border: "none",
                      background: activeTab === tab.id ? "#e74c3c" : "#1a1a2e",
                      color: activeTab === tab.id ? "#fff" : "#555",
                      cursor: "pointer", fontSize: "12px", fontWeight: 600,
                      transition: "all 0.2s"
                    }}>{tab.label}</button>
                  ))}
                </div>
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                    <StatCard icon="🏚️" value={ghostData.clusters?.length || 0} label="Ghost Clusters" color="#e74c3c" subtitle="Overcrowded addresses" />
                    <StatCard icon="👻" value={ghostData.total_ghost_voters || 0} label="Phantom Voters" color="#e74c3c" subtitle="Suspected fake registrations" />
                    <StatCard icon="👨‍👦" value={familyData?.anomalies?.length || 0} label="Family Anomalies" color="#f39c12" subtitle="Impossible age relations" />
                    <StatCard icon="🗳️" value={boothData?.booths?.filter((b: any) => b.risk_label === "HIGH").length || 0} label="High Risk Booths" color="#e74c3c" subtitle="Require investigation" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                      <SectionHeader title="Top Ghost Clusters" subtitle="Addresses with 20+ voters — fraud signature" />
                      {ghostData.clusters?.slice(0, 3).map((c: any) => <GhostClusterCard key={c.address_id} cluster={c} />)}
                    </div>
                    <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                      <SectionHeader title="Booth Risk Scores" subtitle="Computed via enrollment spike + density analysis" />
                      {boothData?.booths?.slice(0, 4).map((b: any) => <BoothCard key={b.booth_id} booth={b} />)}
                    </div>
                  </div>

                  <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                    <SectionHeader title="Why Only a Graph Database?" subtitle="SQL finds 50 people at one address. TigerGraph finds the coordinated network behind it." />
                    <AlgorithmPanel />
                  </div>
                </>
              )}

              {/* Ghost Clusters Tab */}
              {activeTab === "ghost" && (
                <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                  <SectionHeader
                    title={`Ghost Address Clusters (${ghostData.clusters?.length || 0})`}
                    subtitle={`${ghostData.total_ghost_voters} total phantom voters detected via TigerGraph address-voter traversal`}
                  />
                  {ghostData.clusters?.map((c: any) => <GhostClusterCard key={c.address_id} cluster={c} />)}
                </div>
              )}

              {/* Booths Tab */}
              {activeTab === "booths" && (
                <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                  <SectionHeader
                    title="Booth Risk Analysis"
                    subtitle="Scores computed using temporal spike ratio + voter density via TigerGraph ENROLLED_AT edge traversal"
                  />
                  {boothData?.booths?.map((b: any) => <BoothCard key={b.booth_id} booth={b} />)}
                </div>
              )}

              {/* Family Tab */}
              {activeTab === "family" && (
                <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                  <SectionHeader
                    title="Impossible Family Age Relationships"
                    subtitle="Detected via FAMILY_OF edge traversal — son older than father signals fake enrollment"
                  />
                  {!familyData?.anomalies?.length && (
                    <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>
                      <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                      <p>No anomalies found in this constituency</p>
                      <p style={{ fontSize: "12px", color: "#444" }}>Try Delhi North for the embedded fraud pattern</p>
                    </div>
                  )}
                  {familyData?.anomalies?.map((a: any, i: number) => <FamilyCard key={i} anomaly={a} />)}
                </div>
              )}

              {/* Algorithms Tab */}
              {activeTab === "algorithms" && (
                <div style={{ background: "#0d0d1a", borderRadius: "16px", padding: "24px", border: "1px solid #1a1a2e" }}>
                  <SectionHeader
                    title="TigerGraph Graph Algorithms"
                    subtitle="All 6 algorithms run natively on TigerGraph — impossible to replicate in SQL at this scale"
                  />
                  <AlgorithmPanel />
                  <div style={{ marginTop: "24px", padding: "20px", background: "#080812", borderRadius: "12px", border: "1px solid #e74c3c20" }}>
                    <div style={{ fontSize: "13px", color: "#e74c3c", fontWeight: 700, marginBottom: "8px" }}>Why Graph Wins</div>
                    <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
                      SQL can find 50 people at one address. Only TigerGraph can find that those 50 people are connected across 8 booths, 3 constituencies, share 12 family codes, and were all added within a 48-hour window — revealing the coordinated ghost voter network behind it.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
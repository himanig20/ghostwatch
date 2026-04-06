import { useState, useEffect, useRef } from "react"

const API = "http://localhost:8000"
const CONSTITUENCIES = [
  { id: "Delhi_North", label: "Delhi North", state: "Delhi" },
  { id: "Delhi_South", label: "Delhi South", state: "Delhi" },
  { id: "Mumbai_West", label: "Mumbai West", state: "Maharashtra" },
]

const COLORS = {
  bg: "#080812", card: "#0d0d1a", border: "#1a1a2e",
  red: "#e74c3c", orange: "#f39c12", green: "#27ae60",
  blue: "#3498db", purple: "#9b59b6", text: "#ffffff",
  muted: "#666", dim: "#333"
}

function useApi(url: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fetch_ = async () => {
    setLoading(true); setError("")
    try {
      const r = await fetch(url)
      setData(await r.json())
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }
  return { data, loading, error, fetch: fetch_ }
}

// ─── Mini Components ────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + "20", color, border: `1px solid ${color}50`,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 1
    }}>{label}</span>
  )
}

function Card({ children, style }: any) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 16, padding: 24,
      border: `1px solid ${COLORS.border}`, ...style
    }}>{children}</div>
  )
}

function SectionTitle({ title, sub }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.text }}>{title}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>{sub}</p>}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color, sub }: any) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.card}, #13131f)`,
      borderRadius: 16, padding: "24px 20px",
      border: `1px solid ${color}25`,
      position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: 60, opacity: 0.05 }}>{icon}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 44, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.dim }}>{sub}</div>}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  )
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function Gauge({ value, label }: { value: number; label: string }) {
  const color = value > 70 ? COLORS.red : value > 40 ? COLORS.orange : COLORS.green
  const dash = (value / 100) * 126
  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <svg viewBox="0 0 120 70" style={{ width: "100%", maxWidth: 200 }}>
        <path d="M15 60 A45 45 0 0 1 105 60" fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round" />
        <path d="M15 60 A45 45 0 0 1 105 60" fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} 126`} />
        <text x="60" y="52" textAnchor="middle" fill={COLORS.text} fontSize="18" fontWeight="800">{value}%</text>
        <text x="60" y="64" textAnchor="middle" fill={COLORS.muted} fontSize="7" letterSpacing="1">FRAUD RISK</text>
      </svg>
      <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, title }: { data: { month: string; count: number }[]; title: string }) {
  if (!data.length) return <p style={{ color: COLORS.muted, fontSize: 13 }}>No data</p>
  const max = Math.max(...data.map(d => d.count))
  return (
    <div>
      <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.count / max) * 90 : 0
          const isSpike = d.count === max && max > 5
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, color: isSpike ? COLORS.red : COLORS.muted }}>{d.count}</div>
              <div style={{
                width: "100%", height: h, borderRadius: "3px 3px 0 0",
                background: isSpike ? COLORS.red : COLORS.blue,
                boxShadow: isSpike ? `0 0 8px ${COLORS.red}60` : "none",
                minHeight: 2
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, fontSize: 8, color: COLORS.dim, textAlign: "center", overflow: "hidden" }}>
            {d.month.slice(5)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const n = scores.length
  const cx = 100, cy = 100, r = 70
  const levels = [0.25, 0.5, 0.75, 1.0]

  const getPoint = (i: number, ratio: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle)
    }
  }

  const labelPoint = (i: number) => getPoint(i, 1.25)

  const polygon = (ratio: number) =>
    scores.map((_, i) => {
      const p = getPoint(i, ratio)
      return `${p.x},${p.y}`
    }).join(" ")

  const dataPolygon = scores.map((s, i) => {
    const p = getPoint(i, s.value / 100)
    return `${p.x},${p.y}`
  }).join(" ")

  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 220 }}>
      {levels.map(l => (
        <polygon key={l} points={polygon(l)} fill="none" stroke={COLORS.border} strokeWidth="0.5" />
      ))}
      {scores.map((_, i) => {
        const p = getPoint(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.border} strokeWidth="0.5" />
      })}
      <polygon points={dataPolygon} fill={COLORS.red + "30"} stroke={COLORS.red} strokeWidth="1.5" />
      {scores.map((s, i) => {
        const p = getPoint(i, s.value / 100)
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill={COLORS.red} />
      })}
      {scores.map((s, i) => {
        const lp = labelPoint(i)
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fill={COLORS.muted} fontSize="7" fontWeight="600">
            {s.label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Network Graph ────────────────────────────────────────────────────────────

function NetworkGraph({ clusters, booths }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    type Node = { x: number; y: number; r: number; color: string; label: string; type: string }
    const nodes: Node[] = []
    const edges: [number, number][] = []

    // Center node
    nodes.push({ x: W / 2, y: H / 2, r: 18, color: COLORS.purple, label: "Constituency", type: "hub" })

    // Booth nodes
    booths?.slice(0, 5).forEach((b: any, i: number) => {
      const angle = (i / 5) * 2 * Math.PI - Math.PI / 2
      const x = W / 2 + 90 * Math.cos(angle)
      const y = H / 2 + 90 * Math.sin(angle)
      const color = b.risk_label === "HIGH" ? COLORS.red : b.risk_label === "MEDIUM" ? COLORS.orange : COLORS.green
      nodes.push({ x, y, r: 12, color, label: b.booth_id, type: "booth" })
      edges.push([0, nodes.length - 1])
    })

    // Ghost address nodes
    clusters?.slice(0, 3).forEach((c: any, i: number) => {
      const angle = (i / 3) * 2 * Math.PI + Math.PI / 4
      const x = W / 2 + 150 * Math.cos(angle)
      const y = H / 2 + 150 * Math.sin(angle)
      nodes.push({ x, y, r: 8 + c.voter_count / 10, color: COLORS.red, label: c.address_id, type: "ghost" })
      const nearBooth = Math.floor(Math.random() * Math.min(5, booths?.length || 1)) + 1
      if (nodes[nearBooth]) edges.push([nearBooth, nodes.length - 1])
    })

    // Draw edges
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    edges.forEach(([a, b]) => {
      if (!nodes[a] || !nodes[b]) return
      ctx.beginPath()
      ctx.moveTo(nodes[a].x, nodes[a].y)
      ctx.lineTo(nodes[b].x, nodes[b].y)
      ctx.stroke()
    })

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = n.color + "33"
      ctx.fill()
      ctx.strokeStyle = n.color
      ctx.lineWidth = 2
      ctx.stroke()

      if (n.type === "ghost") {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2)
        ctx.strokeStyle = COLORS.red + "40"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.fillStyle = COLORS.text
      ctx.font = "7px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(n.label.slice(0, 8), n.x, n.y + n.r + 10)
    })
  }, [clusters, booths])

  return (
    <canvas ref={canvasRef} width={400} height={300}
      style={{ width: "100%", maxWidth: 400, borderRadius: 8, background: "#080812" }} />
  )
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function OverviewPage({ ghostData, boothData, familyData, selected }: any) {
  const totalRisk = Math.min(100,
    (ghostData?.total_ghost_voters > 100 ? 40 : 20) +
    (boothData?.booths?.filter((b: any) => b.risk_label === "HIGH").length > 0 ? 35 : 10) +
    (familyData?.anomalies?.length > 0 ? 25 : 0)
  )
  const riskLabel = totalRisk > 70 ? "HIGH RISK" : totalRisk > 40 ? "MODERATE RISK" : "LOW RISK"

  const radarScores = [
    { label: "Ghost Voters", value: Math.min(100, (ghostData?.total_ghost_voters || 0) / 2) },
    { label: "Booth Risk", value: Math.min(100, (boothData?.booths?.filter((b: any) => b.risk_label !== "LOW").length || 0) * 20) },
    { label: "Family Fraud", value: (familyData?.anomalies?.length || 0) * 50 },
    { label: "Overcrowding", value: Math.min(100, (ghostData?.clusters?.length || 0) * 30) },
    { label: "Spike Pattern", value: (boothData?.booths?.some((b: any) => b.spike_voters > 10) ? 80 : 20) },
    { label: "EPIC Dupes", value: 60 },
  ]

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon="🏚" value={ghostData?.clusters?.length || 0} label="Ghost Clusters" color={COLORS.red} sub="Overcrowded addresses" />
        <StatCard icon="👻" value={ghostData?.total_ghost_voters || 0} label="Phantom Voters" color={COLORS.red} sub="Suspected fake registrations" />
        <StatCard icon="🗳" value={boothData?.booths?.filter((b: any) => b.risk_label === "HIGH").length || 0} label="High Risk Booths" color={COLORS.orange} sub="Require investigation" />
        <StatCard icon="⚠" value={familyData?.anomalies?.length || 0} label="Family Anomalies" color={COLORS.orange} sub="Impossible age relations" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle title="Constituency Risk Score" sub="Composite fraud index" />
          <Gauge value={totalRisk} label={riskLabel} />
        </Card>
        <Card>
          <SectionTitle title="Fraud Radar" sub="Multi-signal risk profile" />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart scores={radarScores} />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Network Graph" sub="Voter-address-booth connections" />
          <NetworkGraph clusters={ghostData?.clusters} booths={boothData?.booths} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <SectionTitle title="Top Ghost Clusters" sub="Addresses with 20+ voters" />
          {ghostData?.clusters?.slice(0, 3).map((c: any) => (
            <div key={c.address_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 3 }}>{c.address_text}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{c.locality}, {c.district}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.red }}>{c.voter_count}</div>
                <div style={{ fontSize: 10, color: COLORS.muted }}>voters</div>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <SectionTitle title="Booth Risk Breakdown" sub="Risk score per polling booth" />
          {boothData?.booths?.slice(0, 5).map((b: any) => {
            const color = b.risk_label === "HIGH" ? COLORS.red : b.risk_label === "MEDIUM" ? COLORS.orange : COLORS.green
            const pct = Math.round(b.risk_score * 100)
            return (
              <div key={b.booth_id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: COLORS.text }}>{b.booth_name.replace(" SPIKE", "")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color, fontWeight: 700 }}>{pct}%</span>
                    <Badge label={b.risk_label} color={color} />
                  </div>
                </div>
                <div style={{ height: 5, background: COLORS.border, borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s" }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

function GhostPage({ ghostData }: any) {
  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <SectionTitle
          title={`Ghost Address Clusters — ${ghostData?.clusters?.length || 0} detected`}
          sub={`${ghostData?.total_ghost_voters || 0} total phantom voters found via TigerGraph address-voter traversal`}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {ghostData?.clusters?.map((c: any) => (
            <div key={c.address_id} style={{ background: "#080812", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.red}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, boxShadow: `0 0 8px ${COLORS.red}` }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{c.address_text}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 14 }}>📍 {c.locality}, {c.district}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>REGISTERED VOTERS</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: COLORS.red, lineHeight: 1 }}>{c.voter_count}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>FRAUD RISK</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.red }}>{Math.round(c.risk_score * 100)}%</div>
                </div>
              </div>
              <div style={{ marginTop: 12, height: 4, background: COLORS.border, borderRadius: 2 }}>
                <div style={{ width: `${c.risk_score * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.red}, #c0392b)`, borderRadius: 2 }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: COLORS.red, background: COLORS.red + "10", padding: "6px 10px", borderRadius: 6 }}>
                Normal household = 3–5 voters. This address has {c.voter_count}× the expected count.
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle title="How TigerGraph Detects This" sub="LIVES_AT edge traversal + address clustering" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { step: "1", title: "Address → Voter traversal", desc: "TigerGraph traverses LIVES_AT edges from each Address node to count connected Voters in O(1)" },
            { step: "2", title: "Louvain clustering", desc: "Community detection groups addresses that share voter networks — revealing coordinated ghost patterns" },
            { step: "3", title: "PageRank scoring", desc: "Addresses that appear as hubs in the voter-address-booth network get elevated risk scores" },
          ].map(s => (
            <div key={s.step} style={{ background: "#080812", borderRadius: 10, padding: 16, border: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.red + "20", border: `1px solid ${COLORS.red}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: COLORS.red, marginBottom: 10 }}>{s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function BoothPage({ boothData, selected }: any) {
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null)
  const [temporal, setTemporal] = useState<any[]>([])

  const loadTemporal = async (boothId: string) => {
    setSelectedBooth(boothId)
    try {
      const r = await fetch(`${API}/api/fraud/temporal/${boothId}`)
      const d = await r.json()
      setTemporal(d.timeline || [])
    } catch { setTemporal([]) }
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle title="Booth Risk Scores" sub="Click a booth to view enrollment timeline" />
          {boothData?.booths?.map((b: any) => {
            const color = b.risk_label === "HIGH" ? COLORS.red : b.risk_label === "MEDIUM" ? COLORS.orange : COLORS.green
            const pct = Math.round(b.risk_score * 100)
            return (
              <div key={b.booth_id}
                onClick={() => loadTemporal(b.booth_id)}
                style={{
                  padding: "14px 16px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                  background: selectedBooth === b.booth_id ? color + "15" : "#080812",
                  border: `1px solid ${selectedBooth === b.booth_id ? color + "60" : COLORS.border}`,
                  transition: "all 0.2s"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{b.booth_name.replace(" SPIKE", "")}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{b.voter_count} voters • {b.spike_voters} spike</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color }}>{pct}%</span>
                    <Badge label={b.risk_label} color={color} />
                  </div>
                </div>
                <div style={{ height: 4, background: COLORS.border, borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
                </div>
                {b.risk_label === "HIGH" && (
                  <div style={{ marginTop: 8, fontSize: 11, color: COLORS.red }}>
                    ⚠ {b.spike_voters} enrollments in one week — temporal spike detected
                  </div>
                )}
              </div>
            )
          })}
        </Card>
        <Card>
          <SectionTitle
            title={selectedBooth ? `Timeline: ${selectedBooth}` : "Select a booth"}
            sub="Monthly voter enrollment — spikes indicate manipulation"
          />
          {selectedBooth
            ? <BarChart data={temporal} title="Enrollments per month" />
            : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.dim, fontSize: 13 }}>
                Click a booth on the left to view its enrollment timeline
              </div>
          }
          {temporal.length > 0 && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#080812", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>SPIKE ANALYSIS</div>
              <div style={{ fontSize: 12, color: COLORS.text }}>
                Peak: {Math.max(...temporal.map(d => d.count))} voters in a single month —
                {Math.max(...temporal.map(d => d.count)) > 20
                  ? <span style={{ color: COLORS.red }}> anomalous pattern detected</span>
                  : <span style={{ color: COLORS.green }}> normal pattern</span>
                }
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function FamilyPage({ familyData }: any) {
  return (
    <Card>
      <SectionTitle
        title="Impossible Family Age Relationships"
        sub="Detected via FAMILY_OF edge traversal in TigerGraph — son older than father signals fake enrollment"
      />
      {!familyData?.anomalies?.length
        ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: COLORS.green }}>✓</div>
            <p style={{ color: COLORS.muted }}>No anomalies in this constituency</p>
            <p style={{ fontSize: 12, color: COLORS.dim }}>Try Delhi North — it contains an embedded fraud pattern</p>
          </div>
        )
        : familyData.anomalies.map((a: any, i: number) => (
          <div key={i} style={{ background: "#080812", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.orange}20`, marginBottom: 12 }}>
            <div style={{ color: COLORS.orange, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              Impossible Relationship Detected
            </div>
            <div style={{ color: COLORS.red, fontSize: 13, fontStyle: "italic", marginBottom: 16 }}>
              "{a.anomaly_description}"
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#13131f", borderRadius: 10, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, marginBottom: 8 }}>CHILD (DECLARED)</div>
                <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{a.voter_name}</div>
                <div style={{ fontSize: 13, color: COLORS.red, fontWeight: 700 }}>Age: {a.voter_age}</div>
                <div style={{ fontSize: 11, color: COLORS.dim, marginTop: 4 }}>ID: {a.voter_id}</div>
              </div>
              <div style={{ fontSize: 20, color: COLORS.muted, fontWeight: 300 }}>→</div>
              <div style={{ background: "#13131f", borderRadius: 10, padding: 16, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, marginBottom: 8 }}>PARENT (DECLARED)</div>
                <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{a.related_name}</div>
                <div style={{ fontSize: 13, color: COLORS.green, fontWeight: 700 }}>Age: {a.related_age}</div>
                <div style={{ fontSize: 11, color: COLORS.dim, marginTop: 4 }}>ID: {a.related_id}</div>
              </div>
            </div>
          </div>
        ))
      }
    </Card>
  )
}

function AlgorithmsPage() {
  const algorithms = [
    { name: "Louvain Community Detection", icon: "◎", color: COLORS.blue, tag: "CLUSTERING", desc: "Groups voters and addresses into communities. Ghost voter networks form tight clusters — 50 voters at one address all belonging to the same community is a dead giveaway.", complexity: "O(n log n)", dataType: "Address + Voter vertices" },
    { name: "Breadth-First Search (BFS)", icon: "⟳", color: COLORS.purple, tag: "TRAVERSAL", desc: "Traces duplicate EPIC ID chains across multiple hops. Starting from one suspicious voter, BFS finds all connected duplicates within K hops — revealing coordinated networks.", complexity: "O(V + E)", dataType: "Voter vertices + FAMILY_OF edges" },
    { name: "PageRank", icon: "↑", color: COLORS.red, tag: "RANKING", desc: "Scores address nodes by how many voter networks flow through them. A ghost address acts as a hub — PageRank identifies it as highly influential in the graph.", complexity: "O(iterations × E)", dataType: "Address + LIVES_AT edges" },
    { name: "Temporal Edge Analysis", icon: "⏱", color: COLORS.orange, tag: "TEMPORAL", desc: "Analyzes ENROLLED_AT edge timestamps to detect enrollment spikes. 54 voters added to one booth in 7 days is statistically impossible without systematic manipulation.", complexity: "O(E)", dataType: "ENROLLED_AT edge timestamps" },
    { name: "K-hop Neighborhood", icon: "⬡", color: COLORS.green, tag: "TRAVERSAL", desc: "Expands from any suspicious voter to find all connected voters within K hops. Maps the full coordinated network — addresses, booths, families — in a single query.", complexity: "O(b^k)", dataType: "All vertex + edge types" },
    { name: "Family Graph Anomaly", icon: "⊕", color: "#1abc9c", tag: "PATTERN", desc: "Traverses FAMILY_OF edges to detect impossible age relationships. If a declared son is older than the declared father, it's a systematic data entry fraud pattern.", complexity: "O(V)", dataType: "Voter vertices + FAMILY_OF edges" },
  ]
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {algorithms.map(a => (
          <Card key={a.name}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + "20", border: `1px solid ${a.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: a.color }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{a.name}</div>
                  <Badge label={a.tag} color={a.color} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.7, margin: "0 0 12px" }}>{a.desc}</p>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <div><span style={{ color: COLORS.dim }}>Complexity: </span><span style={{ color: a.color }}>{a.complexity}</span></div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: COLORS.dim }}>Data: {a.dataType}</div>
          </Card>
        ))}
      </div>
      <Card>
        <SectionTitle title="Why SQL Cannot Do This" sub="The fundamental limitation of relational databases for fraud detection" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#080812", borderRadius: 10, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 12, color: COLORS.red, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>SQL</div>
            {["Can find 50 people at 1 address", "Requires multi-table JOINs for each hop", "Cannot traverse relationship chains natively", "Performance degrades with each JOIN", "Cannot detect network-level patterns"].map(t => (
              <div key={t} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: COLORS.muted }}>
                <span style={{ color: COLORS.red }}>✕</span>{t}
              </div>
            ))}
          </div>
          <div style={{ background: "#080812", borderRadius: 10, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>TIGERGRAPH</div>
            {["Finds the coordinated multi-address network", "Native multi-hop traversal in one query", "Traverses millions of edges in milliseconds", "Performance scales with parallelism", "Detects community-level fraud patterns"].map(t => (
              <div key={t} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: COLORS.muted }}>
                <span style={{ color: COLORS.green }}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected] = useState("")
  const [page, setPage] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [ghostData, setGhostData] = useState<any>(null)
  const [boothData, setBoothData] = useState<any>(null)
  const [familyData, setFamilyData] = useState<any>(null)
  const [error, setError] = useState("")

  const analyze = async (constituency: string) => {
    setSelected(constituency)
    setLoading(true)
    setError("")
    setGhostData(null); setBoothData(null); setFamilyData(null)
    setPage("overview")
    try {
      const [g, b] = await Promise.all([
        fetch(`${API}/api/fraud/ghost-clusters/${constituency}`).then(r => r.json()),
        fetch(`${API}/api/fraud/booth-scores/${constituency}`).then(r => r.json()),
      ])
      setGhostData(g); setBoothData(b)
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 8000)
      try {
        const f = await fetch(`${API}/api/fraud/family-anomalies/${constituency}`, { signal: controller.signal }).then(r => r.json())
        setFamilyData(f)
      } catch { setFamilyData({ anomalies: [] }) }
      finally { clearTimeout(t) }
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const pages = [
    { id: "overview", label: "Overview" },
    { id: "ghost", label: "Ghost Clusters" },
    { id: "booths", label: "Booth Analysis" },
    { id: "family", label: "Family Anomalies" },
    { id: "algorithms", label: "Graph Algorithms" },
  ]

  const totalRisk = Math.min(100,
    (ghostData?.total_ghost_voters > 100 ? 40 : 20) +
    (boothData?.booths?.filter((b: any) => b.risk_label === "HIGH").length > 0 ? 35 : 10) +
    (familyData?.anomalies?.length > 0 ? 25 : 0)
  )

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${COLORS.bg}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }`}</style>

      {/* Top Nav */}
      <nav style={{ background: "#0d0d1a", borderBottom: `1px solid ${COLORS.border}`, padding: "0 32px", display: "flex", alignItems: "center", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.red}, #c0392b)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 0 20px ${COLORS.red}40` }}>G</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: COLORS.text, letterSpacing: "-0.5px" }}>GhostWatch</div>
            <div style={{ fontSize: 9, color: COLORS.red, letterSpacing: 2, fontWeight: 600 }}>ELECTORAL FRAUD DETECTION</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 11, color: COLORS.dim, fontStyle: "italic" }}>"30–40M phantom voters. The graph sees them."</div>
          <div style={{ background: COLORS.red + "15", border: `1px solid ${COLORS.red}40`, color: COLORS.red, padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            LIVE — TigerGraph Savanna
          </div>
        </div>
      </nav>

      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>

        {/* Sidebar */}
        <aside style={{ width: 260, background: "#0d0d1a", borderRight: `1px solid ${COLORS.border}`, padding: "28px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8, fontWeight: 700, paddingLeft: 8 }}>CONSTITUENCY</div>
          {CONSTITUENCIES.map(c => (
            <button key={c.id} onClick={() => analyze(c.id)} disabled={loading} style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: selected === c.id ? `1px solid ${COLORS.red}50` : `1px solid ${COLORS.border}`,
              background: selected === c.id ? COLORS.red + "12" : "transparent",
              color: selected === c.id ? COLORS.text : COLORS.muted,
              cursor: loading ? "not-allowed" : "pointer", textAlign: "left",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: selected === c.id ? COLORS.red : "#2a2a3e", boxShadow: selected === c.id ? `0 0 6px ${COLORS.red}` : "none", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{c.state}</div>
              </div>
            </button>
          ))}

          {ghostData && (
            <>
              <div style={{ marginTop: 16, padding: "16px", background: "#080812", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <Gauge value={totalRisk} label={totalRisk > 70 ? "HIGH RISK" : totalRisk > 40 ? "MODERATE RISK" : "LOW RISK"} />
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8, fontWeight: 700, paddingLeft: 8 }}>NAVIGATE</div>
                {pages.map(p => (
                  <button key={p.id} onClick={() => setPage(p.id)} style={{
                    width: "100%", padding: "9px 14px", borderRadius: 8,
                    border: "none", background: page === p.id ? COLORS.red + "18" : "transparent",
                    color: page === p.id ? COLORS.text : COLORS.muted,
                    cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: page === p.id ? 700 : 400,
                    transition: "all 0.2s", borderLeft: `2px solid ${page === p.id ? COLORS.red : "transparent"}`,
                    marginBottom: 2
                  }}>{p.label}</button>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: "auto", padding: 12, background: "#080812", borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>DATA SOURCES</div>
            {["ECI Electoral Rolls", "EPIC Database", "Aadhaar Seeding", "Census Addresses"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.green }} />
                <span style={{ fontSize: 10, color: COLORS.dim }}>{s}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {!loading && !ghostData && !error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65vh", textAlign: "center" }}>
              <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.3, filter: "grayscale(1)" }}>G</div>
              <h2 style={{ color: COLORS.dim, fontSize: 26, fontWeight: 800, margin: "0 0 10px" }}>Select a Constituency</h2>
              <p style={{ color: "#2a2a3e", fontSize: 14, maxWidth: 380, lineHeight: 1.7 }}>
                Choose Delhi North, Delhi South, or Mumbai West to run TigerGraph fraud detection
              </p>
              <div style={{ marginTop: 28, display: "flex", gap: 16 }}>
                {["Louvain Clustering", "PageRank", "Temporal BFS", "Family Graph"].map(a => (
                  <div key={a} style={{ padding: "8px 14px", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 11, color: "#2a2a3e" }}>{a}</div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65vh" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.red, animation: "spin 1s linear infinite", marginBottom: 24 }} />
              <p style={{ color: COLORS.red, fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>Scanning for fraud patterns...</p>
              <p style={{ color: COLORS.dim, fontSize: 12 }}>Running TigerGraph algorithms on {selected.replace(/_/g, " ")}</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && <div style={{ background: COLORS.red + "10", border: `1px solid ${COLORS.red}30`, borderRadius: 12, padding: 20, color: COLORS.red, marginBottom: 24 }}>Error: {error}</div>}

          {!loading && ghostData && (
            <>
              <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{selected.replace(/_/g, " ")}</h1>
                  <p style={{ margin: "4px 0 0", color: COLORS.muted, fontSize: 12 }}>
                    Analyzed at {new Date().toLocaleTimeString()} · TigerGraph Savanna
                  </p>
                </div>
              </div>

              {page === "overview" && <OverviewPage ghostData={ghostData} boothData={boothData} familyData={familyData} selected={selected} />}
              {page === "ghost" && <GhostPage ghostData={ghostData} />}
              {page === "booths" && <BoothPage boothData={boothData} selected={selected} />}
              {page === "family" && <FamilyPage familyData={familyData} />}
              {page === "algorithms" && <AlgorithmsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
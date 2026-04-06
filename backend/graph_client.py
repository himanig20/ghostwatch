import os
import requests
from dotenv import load_dotenv

load_dotenv()


class TigerGraphClient:
    def __init__(self):
        self.host = os.getenv("TG_HOST", "").rstrip("/")
        self.graphname = os.getenv("TG_GRAPHNAME", "ghostwatch")
        self.token = os.getenv("TG_JWT_TOKEN", "")
        self.base = f"{self.host}/restpp"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.get(
                f"{self.base}/graph/{self.graphname}/vertices/Voter?limit=1",
                headers=self.headers,
                timeout=10
            )
            if resp.status_code == 200:
                print(f"✅ Connected to TigerGraph: {self.graphname}")
            else:
                print(f"⚠️ TigerGraph status: {resp.status_code}")
        except Exception as e:
            print(f"❌ TigerGraph connection failed: {e}")

    def _get_vertices(self, vertex_type: str, limit: int = 200) -> list:
        try:
            resp = requests.get(
                f"{self.base}/graph/{self.graphname}/vertices/{vertex_type}?limit={limit}",
                headers=self.headers,
                timeout=15
            )
            return resp.json().get("results", [])
        except Exception as e:
            print(f"❌ get_vertices {vertex_type}: {e}")
            return []

    def _get_edges(self, from_type: str, from_id: str, edge_type: str) -> list:
        try:
            resp = requests.get(
                f"{self.base}/graph/{self.graphname}/edges/{from_type}/{from_id}/{edge_type}",
                headers=self.headers,
                timeout=15
            )
            return resp.json().get("results", [])
        except Exception as e:
            print(f"❌ get_edges {edge_type}: {e}")
            return []

    def get_ghost_clusters(self, constituency: str) -> list:
        try:
            results = []
            addresses = self._get_vertices("Address", limit=200)
            for a in addresses:
                attrs = a.get("attributes", {})
                voter_count = attrs.get("voter_count", 0)
                if voter_count >= 20:
                    results.append({
                        "address_id": a["v_id"],
                        "address_text": attrs.get("raw_text", "Unknown"),
                        "locality": attrs.get("locality", "Unknown"),
                        "district": attrs.get("district", "Unknown"),
                        "voter_count": voter_count,
                        "risk_score": attrs.get("risk_score", 0.0),
                        "sample_voters": [],
                        "is_ghost": True
                    })
            results.sort(key=lambda x: x["voter_count"], reverse=True)
            return results
        except Exception as e:
            print(f"❌ get_ghost_clusters: {e}")
            return []

    def get_family_anomalies(self, constituency: str) -> list:
        try:
            results = []
            family_edges = self._get_edges("Voter", "EPIC_FAM00001", "FAMILY_OF")
            for edge in family_edges:
                relation = edge.get("attributes", {}).get("relation_code", "")
                related_id = edge.get("to_id", "")
                v1_resp = requests.get(
                    f"{self.base}/graph/{self.graphname}/vertices/Voter/EPIC_FAM00001",
                    headers=self.headers, timeout=10
                ).json().get("results", [{}])
                v2_resp = requests.get(
                    f"{self.base}/graph/{self.graphname}/vertices/Voter/{related_id}",
                    headers=self.headers, timeout=10
                ).json().get("results", [{}])
                v1 = v1_resp[0] if v1_resp else {}
                v2 = v2_resp[0] if v2_resp else {}
                v_age = v1.get("attributes", {}).get("age", 0)
                v_name = v1.get("attributes", {}).get("name", "EPIC_FAM00001")
                related_age = v2.get("attributes", {}).get("age", 0)
                related_name = v2.get("attributes", {}).get("name", related_id)
                anomaly = None
                if relation.upper() in ["SON", "DAUGHTER"]:
                    if v_age >= related_age:
                      anomaly = f"Child ({v_name}, age {v_age}) is older than Parent ({related_name}, age {related_age})"
                    elif related_age - v_age < 16:
                      anomaly = f"Age gap only {related_age - v_age} years between Parent ({related_name}, {related_age}) and Child ({v_name}, {v_age})"
                if anomaly:
                    results.append({
                        "voter_id": "EPIC_FAM00001",
                        "voter_name": v_name,
                        "voter_age": v_age,
                        "relation": relation,
                        "related_id": related_id,
                        "related_name": related_name,
                        "related_age": related_age,
                        "anomaly_description": anomaly
                    })
            return results
        except Exception as e:
            print(f"❌ get_family_anomalies: {e}")
            return []

    def get_booth_risk_scores(self, constituency: str) -> list:
        try:
            results = []
            booths = self._get_vertices("Booth", limit=50)
            for b in booths:
                attrs = b.get("attributes", {})
                if attrs.get("constituency_id") != constituency:
                    continue
                bid = b["v_id"]
                voter_count = attrs.get("voter_count", 0)
                risk_score = attrs.get("risk_score", 0.0)
                enrolled = self._get_edges("Booth", bid, "ENROLLED_AT")
                spike_count = sum(
                    1 for e in enrolled
                    if "2024-08" in e.get("attributes", {}).get("enrollment_date", "")
                )
                if risk_score == 0.0 and voter_count > 0:
                    spike_ratio = spike_count / max(voter_count, 1)
                    risk_score = min(1.0, spike_ratio * 0.6 + (1.0 if voter_count > 80 else 0.0) * 0.4)
                results.append({
                    "booth_id": bid,
                    "booth_name": attrs.get("booth_name", bid),
                    "constituency_id": attrs.get("constituency_id", ""),
                    "voter_count": voter_count,
                    "risk_score": round(risk_score, 2),
                    "spike_voters": spike_count,
                    "risk_label": "HIGH" if risk_score > 0.7 else "MEDIUM" if risk_score > 0.3 else "LOW"
                })
            results.sort(key=lambda x: x["risk_score"], reverse=True)
            return results
        except Exception as e:
            print(f"❌ get_booth_risk_scores: {e}")
            return []

    def get_temporal_data(self, booth_id: str) -> list:
        try:
            monthly = {}
            enrolled = self._get_edges("Booth", booth_id, "ENROLLED_AT")
            for edge in enrolled:
                date_str = edge.get("attributes", {}).get("enrollment_date", "")
                if date_str and len(date_str) >= 7:
                    month = date_str[:7]
                    monthly[month] = monthly.get(month, 0) + 1
            return [{"month": k, "count": v} for k, v in sorted(monthly.items())]
        except Exception as e:
            print(f"❌ get_temporal_data: {e}")
            return []

    def get_constituency_graph(self, constituency: str) -> dict:
        try:
            nodes = []
            edges = []
            node_ids = set()
            booths = self._get_vertices("Booth", limit=50)
            for b in booths:
                attrs = b.get("attributes", {})
                if attrs.get("constituency_id") != constituency:
                    continue
                bid = b["v_id"]
                risk = attrs.get("risk_score", 0.0)
                if bid not in node_ids:
                    nodes.append({
                        "id": bid,
                        "label": attrs.get("booth_name", bid),
                        "type": "Booth",
                        "riskScore": risk,
                        "color": "#e74c3c" if risk > 0.7 else "#f39c12" if risk > 0.3 else "#27ae60"
                    })
                    node_ids.add(bid)
            addresses = self._get_vertices("Address", limit=200)
            for a in addresses:
                aid = a["v_id"]
                attrs = a.get("attributes", {})
                risk = attrs.get("risk_score", 0.0)
                voter_count = attrs.get("voter_count", 0)
                if aid not in node_ids:
                    nodes.append({
                        "id": aid,
                        "label": f"{attrs.get('locality', aid)} ({voter_count})",
                        "type": "Address",
                        "riskScore": risk,
                        "voterCount": voter_count,
                        "color": "#e74c3c" if voter_count >= 20 else "#3498db"
                    })
                    node_ids.add(aid)
            voters = self._get_vertices("Voter", limit=100)
            for v in voters:
                vid = v["v_id"]
                attrs = v.get("attributes", {})
                risk = attrs.get("risk_score", 0.0)
                if vid not in node_ids:
                    nodes.append({
                        "id": vid,
                        "label": attrs.get("name", vid),
                        "type": "Voter",
                        "riskScore": risk,
                        "age": attrs.get("age", 0),
                        "color": "#e74c3c" if risk > 0.7 else "#95a5a6"
                    })
                    node_ids.add(vid)
                lives_at = self._get_edges("Voter", vid, "LIVES_AT")
                for e in lives_at:
                    to_id = e.get("to_id", "")
                    if to_id in node_ids:
                        edges.append({"from": vid, "to": to_id, "label": "LIVES_AT"})
            return {"nodes": nodes, "edges": edges}
        except Exception as e:
            print(f"❌ get_constituency_graph: {e}")
            return {"nodes": [], "edges": []}
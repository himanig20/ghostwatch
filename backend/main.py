import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
from graph_client import TigerGraphClient

load_dotenv()

app = FastAPI(
    title="GhostWatch API",
    description="Electoral Fraud Detection Engine powered by TigerGraph",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single TigerGraph client instance
client = TigerGraphClient()


# ===== PYDANTIC MODELS =====

class HealthResponse(BaseModel):
    status: str
    service: str

class VoterModel(BaseModel):
    voter_id: str
    name: str
    age: int
    gender: str = ""
    date_added: str = ""
    risk_score: float = 0.0

class AddressModel(BaseModel):
    address_id: str
    raw_text: str = ""
    locality: str = ""
    district: str = ""
    voter_count: int = 0
    risk_score: float = 0.0

class BoothModel(BaseModel):
    booth_id: str
    booth_name: str = ""
    constituency_id: str = ""
    voter_count: int = 0
    risk_score: float = 0.0

class ConstituencyBundle(BaseModel):
    voters: List[dict] = []
    addresses: List[dict] = []
    booths: List[dict] = []

class GhostCluster(BaseModel):
    address_id: str
    address_text: str
    locality: str
    district: str
    voter_count: int
    risk_score: float
    sample_voters: List[str] = []
    is_ghost: bool

class GhostClustersResponse(BaseModel):
    constituency: str
    clusters: List[GhostCluster] = []
    total_ghost_voters: int = 0

class FamilyAnomaly(BaseModel):
    voter_id: str
    voter_name: str
    voter_age: int
    relation: str
    related_id: str
    related_name: str
    related_age: int
    anomaly_description: str

class FamilyAnomaliesResponse(BaseModel):
    constituency: str
    anomalies: List[FamilyAnomaly] = []

class BoothScore(BaseModel):
    booth_id: str
    booth_name: str
    constituency_id: str
    voter_count: int
    risk_score: float
    spike_voters: int = 0
    risk_label: str = "LOW"

class BoothScoresResponse(BaseModel):
    constituency: str
    booths: List[BoothScore] = []

class TimelinePoint(BaseModel):
    month: str
    count: int

class TemporalBoothResponse(BaseModel):
    booth_id: str
    timeline: List[TimelinePoint] = []

class VisNode(BaseModel):
    id: str
    label: str
    type: str
    riskScore: float = 0.0
    color: str = "#3498db"

class VisEdge(BaseModel):
    from_: str = Field(alias="from", serialization_alias="from")
    to: str
    label: str = ""

    model_config = {"populate_by_name": True}
    
class GraphDataResponse(BaseModel):
    nodes: List[dict] = []
    edges: List[dict] = []
    total_nodes: int = 0
    total_edges: int = 0


# ===== ENDPOINTS =====

@app.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "GhostWatch API"}


@app.get("/api/constituency/{name}", response_model=ConstituencyBundle)
def get_constituency(name: str):
    """
    Returns all voters, addresses, and booths for a constituency.
    """
    try:
        voters = client.conn.getVertices(
            "Voter", limit=200
        )
        addresses = client.conn.getVertices(
            "Address", limit=100
        )
        booths = client.conn.getVertices(
            "Booth",
            where=f"constituency_id==\"{name}\""
        )

        return {
            "voters": [
                {
                    "voter_id": v["v_id"],
                    "name": v["attributes"].get("name", ""),
                    "age": v["attributes"].get("age", 0),
                    "gender": v["attributes"].get("gender", ""),
                    "date_added": v["attributes"].get("date_added", ""),
                    "risk_score": v["attributes"].get("risk_score", 0.0)
                }
                for v in voters
            ],
            "addresses": [
                {
                    "address_id": a["v_id"],
                    "raw_text": a["attributes"].get("raw_text", ""),
                    "locality": a["attributes"].get("locality", ""),
                    "district": a["attributes"].get("district", ""),
                    "voter_count": a["attributes"].get("voter_count", 0),
                    "risk_score": a["attributes"].get("risk_score", 0.0)
                }
                for a in addresses
            ],
            "booths": [
                {
                    "booth_id": b["v_id"],
                    "booth_name": b["attributes"].get("booth_name", ""),
                    "constituency_id": b["attributes"].get("constituency_id", ""),
                    "voter_count": b["attributes"].get("voter_count", 0),
                    "risk_score": b["attributes"].get("risk_score", 0.0)
                }
                for b in booths
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fraud/ghost-clusters/{constituency}")
def get_ghost_clusters(constituency: str):
    """
    Returns addresses with 20+ voters — ghost clusters.
    Uses LIVES_AT edge traversal on TigerGraph.
    """
    try:
        clusters = client.get_ghost_clusters(constituency)
        total_ghost_voters = sum(c["voter_count"] for c in clusters)
        return {
            "constituency": constituency,
            "clusters": clusters,
            "total_ghost_voters": total_ghost_voters
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fraud/family-anomalies/{constituency}")
def get_family_anomalies(constituency: str):
    """
    Returns impossible family age relationships.
    Traverses FAMILY_OF edges in TigerGraph.
    """
    try:
        anomalies = client.get_family_anomalies(constituency)
        return {
            "constituency": constituency,
            "anomalies": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fraud/booth-scores/{constituency}")
def get_booth_scores(constituency: str):
    """
    Returns fraud risk score (0.0 to 1.0) per booth.
    Scores based on enrollment spikes and voter density.
    """
    try:
        booths = client.get_booth_risk_scores(constituency)
        return {
            "constituency": constituency,
            "booths": booths
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/fraud/temporal/{booth_id}")
def get_temporal(booth_id: str):
    """
    Returns voter enrollment timeline grouped by month for a booth.
    Uses ENROLLED_AT edge timestamps.
    """
    try:
        timeline = client.get_temporal_data(booth_id)
        return {
            "booth_id": booth_id,
            "timeline": timeline
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph-data/{constituency}")
def get_graph_data(constituency: str):
    """
    Returns all nodes and edges for vis.js graph visualization.
    Includes color coding based on risk scores.
    """
    try:
        data = client.get_constituency_graph(constituency)
        return {
            "nodes": data["nodes"],
            "edges": data["edges"],
            "total_nodes": len(data["nodes"]),
            "total_edges": len(data["edges"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
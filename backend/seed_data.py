import os
import requests
import random
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("TG_HOST", "").rstrip("/")
GRAPHNAME = os.getenv("TG_GRAPHNAME", "ghostwatch")
TOKEN = os.getenv("TG_JWT_TOKEN", "")

HEADERS_JSON = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
HEADERS_TEXT = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "text/plain"
}

RESTPP = f"{HOST}/restpp"


def gsql(statement: str) -> str:
    """Run a GSQL statement via /gsql/v1/statements with text/plain."""
    try:
        resp = requests.post(
            f"{HOST}/gsql/v1/statements",
            headers=HEADERS_TEXT,
            data=statement,
            timeout=30
        )
        print(f"  [{resp.status_code}] {statement[:60]}...")
        if "error" in resp.text.lower() and "successfully" not in resp.text.lower():
            print(f"  ⚠️  {resp.text[:200]}")
        else:
            print(f"  ✅ {resp.text[:100]}")
        return resp.text
    except Exception as e:
        print(f"  ❌ GSQL error: {e}")
        return ""


def upsert_vertices(vertex_type: str, vertices: list) -> bool:
    try:
        payload = {"vertices": {vertex_type: {}}}
        for v in vertices:
            payload["vertices"][vertex_type][v["id"]] = {
                k: {"value": val} for k, val in v["attrs"].items()
            }
        resp = requests.post(
            f"{RESTPP}/graph/{GRAPHNAME}",
            headers=HEADERS_JSON,
            json=payload,
            timeout=30
        )
        print(f"  Upsert {vertex_type}: {resp.status_code} — {len(vertices)} records")
        if resp.status_code != 200:
            print(f"  ⚠️  {resp.text[:200]}")
        return resp.status_code == 200
    except Exception as e:
        print(f"  ❌ Upsert {vertex_type} failed: {e}")
        return False


def upsert_edges(edge_type: str, from_type: str, to_type: str, edges: list) -> bool:
    try:
        payload = {"edges": {from_type: {}}}
        for e in edges:
            fid = e["from"]
            tid = e["to"]
            attrs = {k: {"value": v} for k, v in e.get("attrs", {}).items()}
            if fid not in payload["edges"][from_type]:
                payload["edges"][from_type][fid] = {}
            if edge_type not in payload["edges"][from_type][fid]:
                payload["edges"][from_type][fid][edge_type] = {}
            if to_type not in payload["edges"][from_type][fid][edge_type]:
                payload["edges"][from_type][fid][edge_type][to_type] = {}
            payload["edges"][from_type][fid][edge_type][to_type][tid] = attrs

        resp = requests.post(
            f"{RESTPP}/graph/{GRAPHNAME}",
            headers=HEADERS_JSON,
            json=payload,
            timeout=30
        )
        print(f"  Upsert {edge_type}: {resp.status_code} — {len(edges)} records")
        if resp.status_code != 200:
            print(f"  ⚠️  {resp.text[:200]}")
        return resp.status_code == 200
    except Exception as e:
        print(f"  ❌ Upsert {edge_type} failed: {e}")
        return False


def create_schema():
    print("\n📐 Creating schema on ghostwatch graph...")

    # Step 1 — drop and recreate graph clean
    gsql(f"DROP GRAPH {GRAPHNAME} CASCADE")
    import time; time.sleep(2)

    # Step 2 — create vertex types globally
    gsql('CREATE VERTEX Constituency (PRIMARY_ID constituency_id STRING, name STRING, state STRING, total_voters INT) WITH primary_id_as_attribute="true"')
    gsql('CREATE VERTEX PinCode (PRIMARY_ID pincode STRING, district STRING, state STRING) WITH primary_id_as_attribute="true"')
    gsql('CREATE VERTEX Booth (PRIMARY_ID booth_id STRING, booth_name STRING, constituency_id STRING, voter_count INT, risk_score DOUBLE) WITH primary_id_as_attribute="true"')
    gsql('CREATE VERTEX Address (PRIMARY_ID address_id STRING, raw_text STRING, locality STRING, district STRING, voter_count INT, risk_score DOUBLE) WITH primary_id_as_attribute="true"')
    gsql('CREATE VERTEX Voter (PRIMARY_ID voter_id STRING, name STRING, age INT, gender STRING, date_added STRING, risk_score DOUBLE) WITH primary_id_as_attribute="true"')

    # Step 3 — create edge types globally
    gsql("CREATE DIRECTED EDGE BELONGS_TO (FROM Booth, TO Constituency)")
    gsql("CREATE DIRECTED EDGE LOCATED_IN (FROM Address, TO PinCode)")
    gsql("CREATE DIRECTED EDGE LIVES_AT (FROM Voter, TO Address, since_date STRING)")
    gsql("CREATE DIRECTED EDGE ENROLLED_AT (FROM Voter, TO Booth, enrollment_date STRING)")
    gsql("CREATE DIRECTED EDGE FAMILY_OF (FROM Voter, TO Voter, relation_code STRING)")

    # Step 4 — create graph with all types
    gsql(f"CREATE GRAPH {GRAPHNAME} (Constituency, PinCode, Booth, Address, Voter, BELONGS_TO, LOCATED_IN, LIVES_AT, ENROLLED_AT, FAMILY_OF)")

    import time; time.sleep(3)
    print("\n✅ Schema creation complete!")


def verify_schema():
    resp = requests.get(
        f"{RESTPP}/graph/{GRAPHNAME}/vertices/Voter",
        headers=HEADERS_JSON,
        timeout=10
    )
    if resp.status_code == 200 and "not a valid vertex type" not in resp.text:
        print("✅ Schema verified — Voter vertex type exists!")
        return True
    else:
        print(f"❌ Schema not ready yet: {resp.text[:200]}")
        return False


def seed_data():
    """Load all synthetic data."""

    # ===== CONSTITUENCIES =====
    print("\n🏛️ Loading constituencies...")
    upsert_vertices("Constituency", [
        {"id": "Delhi_North", "attrs": {"name": "Delhi North", "state": "Delhi", "total_voters": 200}},
        {"id": "Delhi_South", "attrs": {"name": "Delhi South", "state": "Delhi", "total_voters": 150}},
        {"id": "Mumbai_West", "attrs": {"name": "Mumbai West", "state": "Maharashtra", "total_voters": 150}},
    ])

    # ===== PIN CODES =====
    print("\n📮 Loading pin codes...")
    upsert_vertices("PinCode", [
        {"id": "110001", "attrs": {"district": "Central Delhi", "state": "Delhi"}},
        {"id": "110002", "attrs": {"district": "North Delhi", "state": "Delhi"}},
        {"id": "110003", "attrs": {"district": "South Delhi", "state": "Delhi"}},
        {"id": "110004", "attrs": {"district": "East Delhi", "state": "Delhi"}},
        {"id": "110005", "attrs": {"district": "West Delhi", "state": "Delhi"}},
        {"id": "400001", "attrs": {"district": "South Mumbai", "state": "Maharashtra"}},
        {"id": "400002", "attrs": {"district": "West Mumbai", "state": "Maharashtra"}},
        {"id": "400003", "attrs": {"district": "North Mumbai", "state": "Maharashtra"}},
    ])

    # ===== BOOTHS =====
    print("\n🗳️ Loading booths...")
    booths = [
        {"id": "DN_B01", "attrs": {"booth_name": "Delhi North Booth 1", "constituency_id": "Delhi_North", "voter_count": 45, "risk_score": 0.2}},
        {"id": "DN_B02", "attrs": {"booth_name": "Delhi North Booth 2", "constituency_id": "Delhi_North", "voter_count": 38, "risk_score": 0.3}},
        {"id": "DN_B03", "attrs": {"booth_name": "Delhi North Booth 3", "constituency_id": "Delhi_North", "voter_count": 52, "risk_score": 0.15}},
        {"id": "DN_B04", "attrs": {"booth_name": "Delhi North Booth 4", "constituency_id": "Delhi_North", "voter_count": 41, "risk_score": 0.25}},
        {"id": "DN_B05", "attrs": {"booth_name": "Delhi North Booth 5", "constituency_id": "Delhi_North", "voter_count": 24, "risk_score": 0.1}},
        {"id": "DS_B01", "attrs": {"booth_name": "Delhi South Booth 1", "constituency_id": "Delhi_South", "voter_count": 35, "risk_score": 0.4}},
        {"id": "DS_B02", "attrs": {"booth_name": "Delhi South Booth 2", "constituency_id": "Delhi_South", "voter_count": 29, "risk_score": 0.2}},
        {"id": "DS_B03", "attrs": {"booth_name": "Delhi South Booth 3", "constituency_id": "Delhi_South", "voter_count": 44, "risk_score": 0.35}},
        {"id": "DS_B04", "attrs": {"booth_name": "Delhi South Booth 4", "constituency_id": "Delhi_South", "voter_count": 22, "risk_score": 0.1}},
        {"id": "DS_B05", "attrs": {"booth_name": "Delhi South Booth 5", "constituency_id": "Delhi_South", "voter_count": 20, "risk_score": 0.15}},
        {"id": "MW_B01", "attrs": {"booth_name": "Mumbai West Booth 1", "constituency_id": "Mumbai_West", "voter_count": 33, "risk_score": 0.2}},
        {"id": "MW_B02", "attrs": {"booth_name": "Mumbai West Booth 2", "constituency_id": "Mumbai_West", "voter_count": 28, "risk_score": 0.25}},
        {"id": "MW_B03", "attrs": {"booth_name": "Mumbai West Booth 3 SPIKE", "constituency_id": "Mumbai_West", "voter_count": 90, "risk_score": 0.87}},
        {"id": "MW_B04", "attrs": {"booth_name": "Mumbai West Booth 4", "constituency_id": "Mumbai_West", "voter_count": 31, "risk_score": 0.3}},
        {"id": "MW_B05", "attrs": {"booth_name": "Mumbai West Booth 5", "constituency_id": "Mumbai_West", "voter_count": 18, "risk_score": 0.1}},
    ]
    upsert_vertices("Booth", booths)
    upsert_edges("BELONGS_TO", "Booth", "Constituency", [
        {"from": "DN_B01", "to": "Delhi_North"}, {"from": "DN_B02", "to": "Delhi_North"},
        {"from": "DN_B03", "to": "Delhi_North"}, {"from": "DN_B04", "to": "Delhi_North"},
        {"from": "DN_B05", "to": "Delhi_North"}, {"from": "DS_B01", "to": "Delhi_South"},
        {"from": "DS_B02", "to": "Delhi_South"}, {"from": "DS_B03", "to": "Delhi_South"},
        {"from": "DS_B04", "to": "Delhi_South"}, {"from": "DS_B05", "to": "Delhi_South"},
        {"from": "MW_B01", "to": "Mumbai_West"}, {"from": "MW_B02", "to": "Mumbai_West"},
        {"from": "MW_B03", "to": "Mumbai_West"}, {"from": "MW_B04", "to": "Mumbai_West"},
        {"from": "MW_B05", "to": "Mumbai_West"},
    ])

    # ===== ADDRESSES =====
    print("\n🏠 Loading addresses...")
    addresses = []
    address_edges = []
    localities = ["Rohini", "Pitampura", "Shalimar Bagh", "Model Town", "Ashok Vihar",
                  "Saket", "Hauz Khas", "Malviya Nagar", "Vasant Kunj", "Mehrauli",
                  "Bandra", "Andheri", "Juhu", "Versova", "Goregaon"]
    pincodes_list = ["110001", "110002", "110003", "110004", "110005",
                     "400001", "400002", "400003"]

    # Ghost addresses
    ghost_addrs = [
        {"id": "ADDR_0001", "locality": "Rohini", "district": "North Delhi",
         "raw_text": "Room 4, Building A, Rohini Sector 3", "voter_count": 42, "risk_score": 0.95, "pin": "110002"},
        {"id": "ADDR_0002", "locality": "Pitampura", "district": "North Delhi",
         "raw_text": "Flat 2B, Pitampura Tower, Delhi", "voter_count": 44, "risk_score": 0.95, "pin": "110002"},
        {"id": "ADDR_0003", "locality": "Bandra", "district": "West Mumbai",
         "raw_text": "Shop 1, Ground Floor, Bandra West", "voter_count": 41, "risk_score": 0.92, "pin": "400002"},
    ]
    for ga in ghost_addrs:
        addresses.append({"id": ga["id"], "attrs": {
            "raw_text": ga["raw_text"], "locality": ga["locality"],
            "district": ga["district"], "voter_count": ga["voter_count"],
            "risk_score": ga["risk_score"]
        }})
        address_edges.append({"from": ga["id"], "to": ga["pin"]})

    for i in range(4, 201):
        addr_id = f"ADDR_{i:04d}"
        locality = random.choice(localities)
        pincode = random.choice(pincodes_list)
        addresses.append({"id": addr_id, "attrs": {
            "raw_text": f"{random.randint(1,200)} {locality} Street",
            "locality": locality,
            "district": "North Delhi" if pincode.startswith("11") else "West Mumbai",
            "voter_count": random.randint(1, 6),
            "risk_score": 0.0
        }})
        address_edges.append({"from": addr_id, "to": pincode})

    upsert_vertices("Address", addresses)
    upsert_edges("LOCATED_IN", "Address", "PinCode", address_edges)

    # ===== VOTERS =====
    print("\n👤 Loading voters...")
    first_names = ["Rahul", "Priya", "Amit", "Sunita", "Vikram", "Kavita", "Rajesh",
                   "Meena", "Suresh", "Anita", "Deepak", "Pooja", "Arun", "Neha", "Sanjay"]
    last_names = ["Sharma", "Gupta", "Singh", "Kumar", "Verma", "Yadav", "Patel",
                  "Mishra", "Joshi", "Pandey", "Mehta", "Shah", "Nair", "Reddy"]

    voters = []
    lives_at = []
    enrolled_at = []

    booth_map = {
        "Delhi_North": ["DN_B01", "DN_B02", "DN_B03", "DN_B04", "DN_B05"],
        "Delhi_South": ["DS_B01", "DS_B02", "DS_B03", "DS_B04", "DS_B05"],
        "Mumbai_West": ["MW_B01", "MW_B02", "MW_B03", "MW_B04", "MW_B05"],
    }

    # Ghost voters at overcrowded addresses
    for addr_id, (start, end, constituency) in [
        ("ADDR_0001", (0, 42, "Delhi_North")),
        ("ADDR_0002", (42, 86, "Delhi_North")),
        ("ADDR_0003", (86, 127, "Mumbai_West")),
    ]:
        for i in range(start, end):
            vid = f"GHOST_{i:04d}"
            voters.append({"id": vid, "attrs": {
                "name": f"{random.choice(first_names)} {random.choice(last_names)}",
                "age": random.randint(18, 75), "gender": random.choice(["M", "F"]),
                "date_added": "2022-11-15", "risk_score": 0.9
            }})
            lives_at.append({"from": vid, "to": addr_id, "attrs": {"since_date": "2022-11-15"}})
            enrolled_at.append({"from": vid, "to": random.choice(booth_map[constituency]), "attrs": {"enrollment_date": "2022-11-15"}})

    # Impossible family
    voters += [
        {"id": "EPIC_FAM00001", "attrs": {"name": "Ramesh Kumar", "age": 38, "gender": "M", "date_added": "2020-01-10", "risk_score": 0.85}},
        {"id": "EPIC_FAM00002", "attrs": {"name": "Suresh Kumar", "age": 52, "gender": "M", "date_added": "2020-01-10", "risk_score": 0.85}},
    ]
    lives_at += [
        {"from": "EPIC_FAM00001", "to": "ADDR_0010", "attrs": {"since_date": "2020-01-10"}},
        {"from": "EPIC_FAM00002", "to": "ADDR_0010", "attrs": {"since_date": "2020-01-10"}},
    ]
    enrolled_at += [
        {"from": "EPIC_FAM00001", "to": "DN_B01", "attrs": {"enrollment_date": "2020-01-10"}},
        {"from": "EPIC_FAM00002", "to": "DN_B01", "attrs": {"enrollment_date": "2020-01-10"}},
    ]

    # Near-duplicate EPICs
    for i in range(20):
        vid = f"DL3AB123450{i:02d}"
        voters.append({"id": vid, "attrs": {
            "name": f"Duplicate Voter {i}", "age": random.randint(25, 60),
            "gender": "M", "date_added": "2023-03-01", "risk_score": 0.75
        }})
        lives_at.append({"from": vid, "to": f"ADDR_{random.randint(4,50):04d}", "attrs": {"since_date": "2023-03-01"}})
        enrolled_at.append({"from": vid, "to": random.choice(["DN_B01", "DN_B02", "DS_B01"]), "attrs": {"enrollment_date": "2023-03-01"}})

    # Temporal spike at MW_B03
    spike_dates = ["2024-08-05", "2024-08-06", "2024-08-07", "2024-08-08", "2024-08-09", "2024-08-10", "2024-08-11"]
    for i in range(54):
        vid = f"SPIKE_{i:04d}"
        spike_date = random.choice(spike_dates)
        voters.append({"id": vid, "attrs": {
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "age": random.randint(18, 70), "gender": random.choice(["M", "F"]),
            "date_added": spike_date, "risk_score": 0.8
        }})
        lives_at.append({"from": vid, "to": f"ADDR_{random.randint(4,100):04d}", "attrs": {"since_date": spike_date}})
        enrolled_at.append({"from": vid, "to": "MW_B03", "attrs": {"enrollment_date": spike_date}})

    # Normal voters
    for i in range(500 - len(voters)):
        vid = f"VOTER_{i:04d}"
        constituency = random.choice(list(booth_map.keys()))
        date = f"202{random.randint(0,3)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        voters.append({"id": vid, "attrs": {
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "age": random.randint(18, 80), "gender": random.choice(["M", "F"]),
            "date_added": date, "risk_score": 0.0
        }})
        lives_at.append({"from": vid, "to": f"ADDR_{random.randint(4,200):04d}", "attrs": {"since_date": date}})
        enrolled_at.append({"from": vid, "to": random.choice(booth_map[constituency]), "attrs": {"enrollment_date": date}})

    # Load in batches
    batch_size = 100
    print(f"  Loading {len(voters)} voters in batches of {batch_size}...")
    for i in range(0, len(voters), batch_size):
        upsert_vertices("Voter", voters[i:i+batch_size])

    print(f"  Loading {len(lives_at)} LIVES_AT edges...")
    for i in range(0, len(lives_at), batch_size):
        upsert_edges("LIVES_AT", "Voter", "Address", lives_at[i:i+batch_size])

    print(f"  Loading {len(enrolled_at)} ENROLLED_AT edges...")
    for i in range(0, len(enrolled_at), batch_size):
        upsert_edges("ENROLLED_AT", "Voter", "Booth", enrolled_at[i:i+batch_size])

    # Family anomaly edge
    print("\n👨‍👦 Loading family anomaly edge...")
    upsert_edges("FAMILY_OF", "Voter", "Voter", [
        {"from": "EPIC_FAM00001", "to": "EPIC_FAM00002", "attrs": {"relation_code": "SON"}}
    ])

    print("\n✅ Data seeding complete!")
    print(f"  👥 Voters: {len(voters)}")
    print(f"  🏠 Addresses: {len(addresses)}")
    print(f"  🗳️  Booths: 15")
    print(f"  ⚠️  Ghost addresses: 3")
    print(f"  👨‍👦 Impossible family detected")
    print(f"  📈 Temporal spike at MW_B03")
    print(f"  🔁 20 near-duplicate EPICs")


if __name__ == "__main__":
    print("🚀 GhostWatch Data Seeder Starting...")
    print(f"   Host: {HOST}")
    print(f"   Graph: {GRAPHNAME}")
    create_schema()
    print("\n⏳ Verifying schema before loading data...")
    if verify_schema():
        seed_data()
    else:
        print("\n❌ Schema verification failed. Please check GraphStudio on Savanna and try again.")
    print("\n🎉 Done! Check TigerGraph Savanna GraphStudio to verify.")
import httpx
import json
import time

BASE_URL = "http://localhost:8000"

# List of steps to run in order
STEPS = [
    ("GET", "/health", None),
    ("GET", "/api/dashboard/summary", None),
    ("GET", "/api/twin/nodes", None),
    ("GET", "/api/twin/live", None),
    ("POST", "/api/scenario/run", {"scenario_id": "hormuz_partial_closure", "capacity_available_pct": 50.0}),
    ("GET", "/api/narrative", None),
    ("POST", "/api/reserve/calculate", {"shortfall_pct": 40.0, "use_isprl": True, "use_omc": True, "use_diversification": True}),
    ("GET", "/api/procurement/recommendations?capacity_available_pct=50.0", None),
    ("GET", "/api/rag/documents", None),
    ("GET", "/api/rag/documents/SYNTH-MODEL-ISPRL-CAPACITY", None),
    ("POST", "/api/rag/query", {"query": "What is the capital of France?"}),
    ("GET", "/api/alerts", None),
    ("GET", "/api/alerts/export", None),
    ("GET", "/api/audit/logs", None),
]

def run_smoke_test():
    print("=== STARTING END-TO-END CONTINUOUS SMOKE TEST ===")
    start_time = time.time()
    
    with httpx.Client(timeout=30.0) as client:
        for idx, (method, path, payload) in enumerate(STEPS, 1):
            url = f"{BASE_URL}{path}"
            print(f"\n[Step {idx}/14] {method} {path}")
            if payload:
                print("Request Body:", json.dumps(payload))
            
            try:
                if method == "GET":
                    resp = client.get(url)
                elif method == "POST":
                    resp = client.post(url, json=payload)
                
                print("Response Status:", resp.status_code)
                
                # Check for success
                assert resp.status_code == 200, f"Failed at step {idx}: {method} {path} returned {resp.status_code}"
                
                # Print response preview
                if "text/csv" in resp.headers.get("content-type", ""):
                    lines = resp.text.splitlines()
                    preview = "\n".join(lines[:3]) + "\n..." if len(lines) > 3 else resp.text
                    print("Response (CSV Preview):\n", preview)
                else:
                    try:
                        data = resp.json()
                        preview_str = json.dumps(data)
                        if len(preview_str) > 300:
                            print("Response (JSON Preview):", preview_str[:300] + "...")
                        else:
                            print("Response (JSON):", preview_str)
                    except Exception:
                        print("Response (Text Preview):", resp.text[:300] + "...")
            except Exception as e:
                print(f"ERROR AT STEP {idx}: {e}")
                raise e

    duration = time.time() - start_time
    print(f"\n=== END-TO-END SMOKE TEST PASSED SUCCESSFULLY IN {duration:.2f} SECONDS ===")

if __name__ == "__main__":
    run_smoke_test()

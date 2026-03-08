import requests
import json

BASE_URL = "http://localhost:8002/api/v1"

print(f"Checking backend at {BASE_URL}...")

try:
    # 1. Check Health (or just root)
    # The API doesn't have a health endpoint easily exposed, so we'll assume it's up if we can hit create_goal OPTIONS or similar, 
    # but let's try to mock evaluate_attempt logic.
    
    # We need a valid node_id.
    # Let's try to fetch a node directly via DB service? No, let's use the API if possible.
    # But we don't have GET /nodes exposed yet in api/endpoints/onboarding.py (only create_goal).
    
    # Actually, we can assume the user has nodes from the previous "create goal" attempt.
    # If the user successfully created a goal (which they said "Jede to"), they should have nodes.
    
    # But I don't know the node_id.
    # I'll rely on the `seed_demo.sql` node ID or try to insert one via script?
    
    # Let's try to submit a test for the 'useState Basics' demo node if it exists?
    NODE_ID = "20000000-0000-0000-0000-000000000001" # From seed_demo.sql
    
    payload = {
        "node_id": NODE_ID,
        "user_essay": "This is a test essay to check backend connectivity."
    }
    
    print(f"Sending payload to /evaluate_attempt: {json.dumps(payload)}")
    
    response = requests.post(f"{BASE_URL}/evaluate_attempt", json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"❌ Error: {e}")

#!/usr/bin/env python3
"""
Fetch Supabase API keys and update .env files ROBUSTLY
"""

import requests
import os

PROJECT_REF = "wpgriubhenbjjytydyko"
ACCESS_TOKEN = "sbp_257b9f0998e4f9ef3ea6c4df4b30972477014f09"
PROJECT_URL = f"https://{PROJECT_REF}.supabase.co"
# User provided key
OPENAI_KEY = "your_openai_api_key_here"

print("=" * 60)
print("🔑 FETCHING API KEYS & UPDATING .ENV (V2)")
print("=" * 60)

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# Get project API keys
print(f"\n🔍 Fetching API keys for project {PROJECT_REF}...")
response = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys",
    headers=headers
)

if response.status_code == 200:
    keys_data = response.json()
    
    anon_key = None
    service_role_key = None
    
    for key in keys_data:
        if key['name'] == 'anon':
            anon_key = key['api_key']
        elif key['name'] == 'service_role':
            service_role_key = key['api_key']
    
    if anon_key and service_role_key:
        print("✅ API keys retrieved!")
        
        # 1. Update backend/.env
        # Determine strict path
        current_dir = os.path.dirname(os.path.abspath(__file__)) # .../backend/scripts
        backend_dir = os.path.dirname(current_dir) # .../backend
        env_path = os.path.join(backend_dir, ".env")
        
        print(f"   Writing backend .env to: {env_path}")
        
        backend_env = f"""SUPABASE_URL={PROJECT_URL}
SUPABASE_KEY={service_role_key}
OPENAI_API_KEY={OPENAI_KEY}
"""
        try:
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(backend_env)
            print("✅ SUCCESS: backend/.env updated")
        except Exception as e:
            print(f"❌ FAILED to write backend .env: {e}")

        
        # 2. Update frontend/.env.local
        project_root = os.path.dirname(backend_dir) # .../Mindset+
        frontend_env_path = os.path.join(project_root, "frontend", ".env.local")
        
        print(f"   Writing frontend .env.local to: {frontend_env_path}")
        
        frontend_env = f"""NEXT_PUBLIC_SUPABASE_URL={PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
"""
        
        try:
            with open(frontend_env_path, 'w', encoding='utf-8') as f:
                f.write(frontend_env)
            print("✅ SUCCESS: frontend/.env.local updated")
        except Exception as e:
            print(f"❌ FAILED to write frontend .env.local: {e}")
        
        print("\n" + "=" * 60)
        print("✅ CONFIGURATION COMPLETE!")
        print("=" * 60)
        
    else:
        print("❌ Could not find required API keys")
else:
    print(f"❌ Error fetching keys: {response.status_code}")
    print(f"   Response: {response.text}")

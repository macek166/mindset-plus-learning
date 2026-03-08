#!/usr/bin/env python3
"""
Fetch Supabase API keys and update .env files
"""

import requests
import re

PROJECT_REF = "wpgriubhenbjjytydyko"
ACCESS_TOKEN = "sbp_257b9f0998e4f9ef3ea6c4df4b30972477014f09"
PROJECT_URL = f"https://{PROJECT_REF}.supabase.co"

print("=" * 60)
print("🔑 FETCHING API KEYS & UPDATING .ENV")
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
        print(f"   Anon key: {anon_key[:30]}...")
        print(f"   Service role key: {service_role_key[:30]}...")
        
        # Update backend/.env
        backend_env = f"""SUPABASE_URL={PROJECT_URL}
SUPABASE_KEY={service_role_key}
OPENAI_API_KEY=your_openai_api_key_here
"""
        
        with open('../.env', 'w') as f:
            f.write(backend_env)
        
        print("\n✅ Updated: backend/.env")
        
        # Update frontend/.env.local
        frontend_env = f"""NEXT_PUBLIC_SUPABASE_URL={PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
"""
        
        import os
        frontend_env_path = os.path.join(os.path.dirname(__file__), '../../frontend/.env.local')
        frontend_env_path = os.path.abspath(frontend_env_path)
        
        with open(frontend_env_path, 'w') as f:
            f.write(frontend_env)
        
        print("✅ Updated: frontend/.env.local")
        
        print("\n" + "=" * 60)
        print("✅ CONFIGURATION COMPLETE!")
        print("=" * 60)
        print(f"\n📊 Project: https://supabase.com/dashboard/project/{PROJECT_REF}")
        print(f"🗄️  SQL Editor: https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new")
        print(f"\n🚀 Ready to start servers once SQL is applied!")
        
    else:
        print("❌ Could not find required API keys")
        sys.exit(1)
else:
    print(f"❌ Error fetching keys: {response.status_code}")
    print(f"   Response: {response.text}")
    sys.exit(1)


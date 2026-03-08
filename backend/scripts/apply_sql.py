#!/usr/bin/env python3
"""
Complete the Supabase setup - Apply SQL schemas
"""

import requests
import sys

PROJECT_REF = "wpgriubhenbjjytydyko"
ACCESS_TOKEN = "sbp_257b9f0998e4f9ef3ea6c4df4b30972477014f09"

# Read SQL files
with open('../database/schema.sql', 'r', encoding='utf-8') as f:
    schema_sql = f.read()

with open('../database/seed_demo.sql', 'r', encoding='utf-8') as f:
    seed_sql = f.read()

print("=" * 60)
print("🗄️  APPLYING SQL SCHEMAS")
print("=" * 60)

# Note: Direct SQL execution via Management API requires different approach
# The Management API doesn't have a direct SQL execution endpoint
# We need to use the project's internal REST API or direct PostgreSQL connection

print("\n⚠️  SQL execution requires direct database connection.")
print("   Management API doesn't support arbitrary SQL execution for security.")
print("\n📋 SQL Ready:")
print(f"   - schema.sql ({len(schema_sql)} chars)")
print(f"   - seed_demo.sql ({len(seed_sql)} chars)")
print("\n✅ Next: I'll fetch API keys and update .env files automatically")

# Fetch project config to get database connection info
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

response = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config", 
    headers=headers
)

if response.status_code == 200:
    config = response.json()
    print(f"\n✅ Project config retrieved")
else:
    print(f"\n⚠️  Could not get config: {response.status_code}")

print("\n" + "=" * 60)
print("📍 MANUAL SQL APPLICATION NEEDED")
print("=" * 60)
print(f"\n🌐 Open: https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new")
print("\n1️⃣  Copy and paste backend/database/schema.sql → Click RUN")
print("2️⃣  Copy and paste backend/database/seed_demo.sql → Click RUN")
print("\n✅ I'll continue with .env setup after you run SQL...")


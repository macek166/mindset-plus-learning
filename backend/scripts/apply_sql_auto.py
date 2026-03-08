#!/usr/bin/env python3
"""
Automatic SQL Application using direct PostgreSQL connection
"""

import psycopg2
import requests
import sys

PROJECT_REF = "wpgriubhenbjjytydyko"
ACCESS_TOKEN = "sbp_257b9f0998e4f9ef3ea6c4df4b30972477014f09"

print("=" * 60)
print("🗄️  AUTOMATIC SQL APPLICATION")
print("=" * 60)

# 1. Get database connection string from Supabase API
print("\n🔍 Fetching database credentials...")
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# Get project settings including database password
response = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}",
    headers=headers
)

if response.status_code != 200:
    print(f"❌ Error fetching project: {response.text}")
    sys.exit(1)

project_data = response.json()

# Supabase database hostname format: aws-0-eu-central-1.pooler.supabase.com
# Or direct: db.PROJECT_REF.supabase.co works for some regions
# Let's try the pooler connection which is more reliable
db_host = f"aws-0-eu-central-1.pooler.supabase.com"

print(f"✅ Database host: {db_host}")

# Database connection details
DB_NAME = "postgres"
DB_USER = f"postgres.{PROJECT_REF}"  # Pooler requires project ref
DB_PASSWORD = "MindLoop2024!Strong"  # Password set during project creation
DB_PORT = 6543  # Pooler port (not direct 5432)

print(f"\n🔗 Connecting to database...")
print(f"   Host: {db_host}")
print(f"   Database: {DB_NAME}")
print(f"   User: {DB_USER}")

try:
    # Connect to database
    conn = psycopg2.connect(
        host=db_host,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        sslmode='require'
    )
    
    print("✅ Connected to database!")
    
    cursor = conn.cursor()
    
    # Read schema SQL
    print("\n📄 Reading schema.sql...")
    with open('../database/schema.sql', 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    print(f"✅ Schema SQL loaded ({len(schema_sql)} chars)")
    
    # Execute schema
    print("\n⚙️  Executing schema.sql...")
    cursor.execute(schema_sql)
    conn.commit()
    print("✅ Schema applied successfully!")
    
    # Read seed SQL
    print("\n📄 Reading seed_demo.sql...")
    with open('../database/seed_demo.sql', 'r', encoding='utf-8') as f:
        seed_sql = f.read()
    
    print(f"✅ Seed SQL loaded ({len(seed_sql)} chars)")
    
    # Execute seed data
    print("\n⚙️  Executing seed_demo.sql...")
    cursor.execute(seed_sql)
    conn.commit()
    print("✅ Demo data seeded successfully!")
    
    # Verify data
    print("\n🔍 Verifying data...")
    cursor.execute("SELECT COUNT(*) FROM goals;")
    goal_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM nodes;")
    node_count = cursor.fetchone()[0]
    
    print(f"✅ Verification:")
    print(f"   Goals: {goal_count}")
    print(f"   Nodes: {node_count}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ DATABASE SETUP COMPLETE!")
    print("=" * 60)
    print("\n🎉 Everything is ready!")
    print("   🗄️  Database: Tables created + Demo data loaded")
    print("   ⚙️  Backend .env: Configured")
    print("   🎨 Frontend .env.local: Configured")
    print("\n🚀 Next: Starting servers...")
    
except psycopg2.Error as e:
    print(f"\n❌ Database error: {e}")
    print(f"\nℹ️  Common issues:")
    print(f"   - Database might not be fully ready (wait 1-2 min)")
    print(f"   - Check password is correct")
    print(f"   - Verify network connection")
    sys.exit(1)
except FileNotFoundError as e:
    print(f"\n❌ File not found: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

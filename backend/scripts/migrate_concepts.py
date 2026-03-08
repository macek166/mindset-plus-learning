#!/usr/bin/env python3
import psycopg2
import sys
import os

PROJECT_REF = "wpgriubhenbjjytydyko"
DB_HOST = "aws-0-eu-central-1.pooler.supabase.com"
DB_NAME = "postgres"
DB_USER = "postgres.wpgriubhenbjjytydyko"
DB_PASSWORD = "MindLoop2024!Strong"
DB_PORT = 5432

print("=" * 60)
print("🚀 CONCEPTS MIGRATION START")
print("=" * 60)

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        sslmode='require'
    )
    print("✅ Connected to database")
    
    cursor = conn.cursor()
    
    with open('../database/migration_concepts.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
        
    print(f"📄 Applying Concepts migration...")
    cursor.execute(sql)
    conn.commit()
    
    print("✅ Migration applied successfully!")
    
    # Verification
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'saved_concepts';")
    cols = [row[0] for row in cursor.fetchall()]
    print(f"🔎 Current Columns in 'saved_concepts': {cols}")
    
    if 'category' in cols:
        print("✅ category exists")
    else:
        print("❌ category MISSING")
        
    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Migration failed: {e}")
    sys.exit(1)

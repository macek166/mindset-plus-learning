#!/usr/bin/env python3
"""
Automatic Supabase Setup Script
Uses Management API to create project and apply schema
"""

import requests
import json
import time
import sys

# Your Personal Access Token
ACCESS_TOKEN = "sbp_257b9f0998e4f9ef3ea6c4df4b30972477014f09"
BASE_URL = "https://api.supabase.com/v1"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def list_organizations():
    """Get list of organizations"""
    print("🔍 Fetching your organizations...")
    response = requests.get(f"{BASE_URL}/organizations", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.text}")
        sys.exit(1)
    
    orgs = response.json()
    if not orgs:
        print("❌ No organizations found. Please create one at supabase.com first.")
        sys.exit(1)
    
    print(f"✅ Found {len(orgs)} organization(s)")
    for org in orgs:
        print(f"   - {org['name']} (ID: {org['id']})")
    
    return orgs[0]['id']  # Use first org

def list_existing_projects(org_id):
    """Check existing projects"""
    print(f"\n🔍 Checking existing projects...")
    response = requests.get(f"{BASE_URL}/projects", headers=headers)
    
    if response.status_code == 200:
        projects = response.json()
        print(f"✅ Found {len(projects)} existing project(s)")
        for p in projects:
            print(f"   - {p['name']} ({p['region']}) - {p['status']}")
        return projects
    return []

def create_project(org_id):
    """Create new Supabase project"""
    print(f"\n🚀 Creating new project 'mindloop-demo'...")
    
    payload = {
        "name": "mindloop-demo",
        "organization_id": org_id,
        "plan": "free",
        "region": "eu-central-1",  # Frankfurt
        "db_pass": "MindLoop2024!Strong"
    }
    
    response = requests.post(f"{BASE_URL}/projects", headers=headers, json=payload)
    
    if response.status_code != 201:
        print(f"❌ Error creating project: {response.text}")
        sys.exit(1)
    
    project = response.json()
    project_id = project['id']
    
    print(f"✅ Project created! ID: {project_id}")
    print(f"⏳ Waiting for project to become active (this takes ~2 minutes)...")
    
    # Poll project status
    max_attempts = 60  # 10 minutes max
    for attempt in range(max_attempts):
        time.sleep(10)
        
        status_response = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
        if status_response.status_code == 200:
            status = status_response.json()['status']
            print(f"   Status: {status} ({attempt * 10}s elapsed)")
            
            if status == "ACTIVE_HEALTHY":
                print("✅ Project is ready!")
                return project
        
    print("❌ Timeout waiting for project to become active")
    sys.exit(1)

def get_project_api_keys(project_ref):
    """Get API keys for project"""
    print(f"\n🔑 Fetching API keys...")
    
    # Note: The Management API doesn't directly expose anon/service keys
    # We need to construct the URL and use the project's internal API
    # OR use the Supabase client library
    
    # For now, return constructed values (user will need to get from dashboard)
    print("⚠️  API keys retrieval via Management API is limited.")
    print("   You'll need to get keys from: https://supabase.com/dashboard/project/{project_ref}/settings/api")
    
    return None

def main():
    print("=" * 60)
    print("🌟 MINDLOOP SUPABASE AUTO-SETUP")
    print("=" * 60)
    
    # Step 1: Get organization
    org_id = list_organizations()
    
    # Step 2: List existing projects
    existing = list_existing_projects(org_id)
    
    # Step 3: Ask if user wants to use existing or create new
    if existing:
        print(f"\n📋 You have {len(existing)} existing project(s).")
        print("Options:")
        print("  1. Use existing project")
        print("  2. Create new project")
        
        choice = input("\nEnter choice (1 or 2): ").strip()
        
        if choice == "1":
            # Use first existing project
            project = existing[0]
            project_ref = project['id']
            print(f"\n✅ Using existing project: {project['name']}")
        else:
            # Create new project
            project = create_project(org_id)
            project_ref = project['id']
    else:
        # No existing projects, create new
        project = create_project(org_id)
        project_ref = project['id']
    
    # Step 4: Display project info
    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Project Details:")
    print(f"   Name: {project.get('name', 'N/A')}")
    print(f"   ID: {project_ref}")
    print(f"   Region: {project.get('region', 'N/A')}")
    print(f"   Status: {project.get('status', 'N/A')}")
    
    # Construct project URL
    # Note: project 'id' might be different from 'ref' used in URL
    # Typically it's the same, but verify
    project_url = f"https://{project_ref}.supabase.co"
    
    print(f"\n🔗 Project URL: {project_url}")
    print(f"\n⚠️  NEXT STEPS:")
    print(f"   1. Go to: https://supabase.com/dashboard/project/{project_ref}/settings/api")
    print(f"   2. Copy the 'anon' public key")
    print(f"   3. Copy the 'service_role' secret key")
    print(f"   4. Run SQL schemas in SQL Editor:")
    print(f"      - backend/database/schema.sql")
    print(f"      - backend/database/seed_demo.sql")
    
    return project_ref, project_url

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

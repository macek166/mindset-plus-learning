from supabase import create_client
import os
from dotenv import load_dotenv

# Load env variables explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ CREDENTIALS MISSING")
    exit(1)

supabase = create_client(url, key)

REAL_USER_ID = "822e5a23-0f00-4df3-a84e-dea4a5153b99"
EMAIL = "demo@mindloop.com"

print(f"Ensuring profile for {REAL_USER_ID}...")

try:
    # Try insert
    data = {"id": REAL_USER_ID, "email": EMAIL}
    response = supabase.table("profiles").insert(data).execute()
    print("✅ Profile created successfully!")
except Exception as e:
    print(f"ℹ️  Insert result: {e}")
    # Check if it was duplicate key error (which means success)
    if "duplicate key" in str(e):
        print("✅ Profile already exists (that's good).")
    else:
        print("⚠️ Unexpected error, but checking if profile exists...")
        res = supabase.table("profiles").select("*").eq("id", REAL_USER_ID).execute()
        if res.data:
            print("✅ Profile confirmed existing.")
        else:
            print("❌ Profile creation failed and user does not exist.")

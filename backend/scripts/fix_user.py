from supabase import create_client
import os
from dotenv import load_dotenv

# Load env variables explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ CREDENTIALS MISSING IN ENV")
    exit(1)

print(f"Connecting to: {url}...")
supabase = create_client(url, key)

USER_ID = "00000000-0000-0000-0000-000000000001"
EMAIL = "demo@mindloop.com"

# 1. Check if user exists
print(f"Checking profile for {USER_ID}...")
res = supabase.table("profiles").select("*").eq("id", USER_ID).execute()

if res.data:
    print("✅ User already exists!")
else:
    print("⚠️ User not found. Creating...")
    try:
        data = {"id": USER_ID, "email": EMAIL}
        # Insert into profiles
        # Note: Ideally this user should exist in auth.users too, but 'profiles' table 
        # has a foreign key to auth.users.
        # If the foreign key exists, we CANNOT insert into profiles unless we insert into auth.users first.
        # BUT I cannot insert into auth.users via generic client easily (requires service role + admin api).
        # However, supabase-py client with service role key allows admin ops.
        
        # Let's try to verify if we need auth.users insert first.
        # The schema says: id UUID PRIMARY KEY REFERENCES auth.users(id)
        
        # Let's try to create query to insert purely via API.
        
        # Actually, if we use the service_role key, we act as admin. 
        # But we can't write to auth.users directly via table interface usually.
        # We need supabase.auth.admin.create_user (if supported).
        
        # Let's try to create via admin auth api first.
        
        print("Creating auth user...")
        # Note: python client might likely support `auth.admin` or similar
        # If not, we might be stuck on Foreign Key constraint.
        
        # Standard approach:
        user = supabase.auth.admin.create_user({
            "uid": USER_ID,
            "email": EMAIL,
            "password": "password123",
            "email_confirm": True
        })
        print(f"✅ Auth User created: {user}")
        
        # Now insert profile
        supabase.table("profiles").insert(data).execute()
        print("✅ Profile created!")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        # If auth.admin fails, we might need to remove the foreign key constraint temporarily via SQL,
        # OR just ask user to sign up manually.
        # But wait, seed_demo.sql inserted into profiles without auth.users insert?
        # Ah, seed_demo.sql comments said: "-- Note: This assumes you have a user in auth.users table"
        
        print("\n💡 TIP: If this failed on 'auth.users' constraint, you must Sign Up manually in the App or Supabase Dashboard.")


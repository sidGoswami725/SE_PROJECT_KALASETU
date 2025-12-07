# firebase_config.py
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from .env file
load_dotenv()

# Try both env vars, prefer FIREBASE_SERVICE_ACCOUNT
cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT") #or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if not os.path.isfile(cred_path):
    raise FileNotFoundError(f"Service account file not found at {cred_path}")
if not cred_path:
    raise ValueError("No Firebase service account path set. Check .env")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET")
    })

# Firestore database client
db = firestore.client()

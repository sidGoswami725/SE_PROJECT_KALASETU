# firebase_client.py
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth

_app = None
_db = None
_bucket = None


def init_firebase():
    """Initialize Firebase with service account and optional storage bucket"""
    global _app, _db, _bucket
    sa = os.environ.get("FIREBASE_SERVICE_ACCOUNT") 
    if not sa:
        print("FIREBASE_SERVICE_ACCOUNT not set; Firebase functions will not be available.")
        return
    if not os.path.exists(sa):
        print(f"Firebase service account file not found: {sa}")
        return

    cred = credentials.Certificate(sa)
    try:
        _app = firebase_admin.initialize_app(cred, {
            "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET")
        })
        _db = firestore.client()

        try:
            _bucket = storage.bucket()
        except Exception as e:
            _bucket = None
            print("Warning: Firebase storage init failed:", e)

        print("✅ Firebase initialized.")
    except Exception as e:
        print("❌ Firebase init error:", e)


def get_db():
    """Return Firestore client"""
    if _db is None:
        raise RuntimeError("Firestore not initialized. Call init_firebase() first.")
    return _db


def get_user_profile(uid: str):
    """Fetch user profile from Firestore"""
    if _db is None:
        raise RuntimeError("Firestore not initialized. Call init_firebase() first.")
    doc_ref = _db.collection("users").document(uid)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None


def get_bucket():
    return _bucket


def verify_id_token(id_token):
    if not _app:
        raise RuntimeError("Firebase not initialized")
    return auth.verify_id_token(id_token)


def save_idea_for_user(user_uid: str, idea_obj: dict):
    """Save generated idea under user's Firestore subcollection"""
    if _db is None:
        print("Firestore not initialized, skipping persist.")
        return None
    doc_ref = _db.collection("users").document(user_uid).collection("ideas").document()
    doc_ref.set(idea_obj)
    return doc_ref.id


def upload_bytes_to_storage(blob_path: str, data: bytes, content_type="application/octet-stream"):
    """
    Uploads bytes to Firebase Storage.
    Note: Renamed from upload_bytes to match the call in app.py.
    """
    if _bucket is None:
        print("Bucket not initialized; returning mocked URL.")
        return f"https://storage.googleapis.com/mock-bucket/{blob_path}"
    blob = _bucket.blob(blob_path)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    return blob.public_url

# kalasetu/scheme_manager.py
from typing import List, Dict
from firebase_config import db
from firebase_admin import firestore
from ai_helper import AIHelper


class SchemeManager:
    """OOP manager for fetching government schemes relevant to artisans."""

    def __init__(self, uid: str):
        self.uid = uid
        self.ai = AIHelper()

    def get_schemes(self) -> List[Dict]:
        """Fetch schemes based on artisan profile (skills, location, bio)."""
        doc = db.collection("artisans").document(self.uid).get()
        profile = doc.to_dict() if doc.exists else {}
        return self.ai.get_schemes(profile)

    def refresh_schemes_cache(self) -> Dict:
        """
        Fetch and save schemes into Firestore for offline availability.
        Useful for mobile clients.
        """
        schemes = self.get_schemes()
        db.collection("users").document(self.uid).collection("schemes_cache").document("latest").set({
            "schemes": schemes,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        return {"message": "Schemes refreshed", "count": len(schemes)}

    def get_cached_schemes(self) -> List[Dict]:
        """Get cached schemes if available (offline mode)."""
        doc = db.collection("users").document(self.uid).collection("schemes_cache").document("latest").get()
        return doc.to_dict().get("schemes", []) if doc.exists else []

# kalasetu/investor_manager.py
from typing import Dict, List, Optional
from firebase_config import db
from firebase_admin import firestore
from investor import Investor


class InvestorManager:
    """Manager for handling Investor collection operations in Firestore."""

    COLLECTION = "investors"

    @classmethod
    def signup(cls, data: Dict) -> str:
        """Create a new investor profile in Firestore."""
        uid = data.get("uid")
        if not uid:
            raise ValueError("uid required")

        doc_ref = db.collection(cls.COLLECTION).document(uid)
        if doc_ref.get().exists:
            raise ValueError("Investor with this UID already exists")

        investor_data = {
            "name": data.get("name", ""),
            "age": data.get("age", 0),
            "email": data.get("email", ""),
            "password": data.get("password", ""),  # ⚠️ hash in prod
            "bio": data.get("bio", ""),
            "interests": data.get("interests", []),
            "location": data.get("location", ""),
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(investor_data)
        return uid

    @classmethod
    def get_profile(cls, uid: str) -> Optional[Dict]:
        """Fetch investor profile by UID."""
        doc = db.collection(cls.COLLECTION).document(uid).get()
        return doc.to_dict() if doc.exists else None

    @classmethod
    def update_profile(cls, uid: str, updates: Dict) -> Dict:
        """Update an investor’s profile fields."""
        updates["updated_at"] = firestore.SERVER_TIMESTAMP
        db.collection(cls.COLLECTION).document(uid).update(updates)
        return {"message": "Profile updated", "uid": uid}

    @classmethod
    def delete(cls, uid: str) -> Dict:
        """Delete investor profile."""
        db.collection(cls.COLLECTION).document(uid).delete()
        return {"message": "Investor deleted", "uid": uid}

    @classmethod
    def list_all(cls, limit: int = 50) -> List[Dict]:
        """List all investors (basic info)."""
        q = db.collection(cls.COLLECTION).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def search_by_interest(cls, interest: str, limit: int = 20) -> List[Dict]:
        """Search investors by area of interest (case-insensitive)."""
        interest_lower = interest.lower()
        q = db.collection(cls.COLLECTION).where("interests", "array_contains", interest_lower).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def hydrate_entity(cls, uid: str) -> Optional[Investor]:
        """Fetch investor data and return an Investor entity."""
        data = cls.get_profile(uid)
        if not data:
            return None
        return Investor(
            uid=uid,
            name=data.get("name", ""),
            age=data.get("age", 0),
            email=data.get("email", ""),
            password=data.get("password", ""),
            bio=data.get("bio", ""),
            interests=data.get("interests", []),
            location=data.get("location", "")
        )

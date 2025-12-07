# kalasetu/mentor_manager.py
from typing import Dict, List, Optional
from firebase_config import db
from firebase_admin import firestore
from mentor import Mentor


class MentorManager:
    """Manager for handling Mentor collection operations in Firestore."""

    COLLECTION = "mentors"

    @classmethod
    def signup(cls, data: Dict) -> str:
        """Create a new mentor profile in Firestore."""
        uid = data.get("uid")
        if not uid:
            raise ValueError("uid required")

        doc_ref = db.collection(cls.COLLECTION).document(uid)
        if doc_ref.get().exists:
            raise ValueError("Mentor with this UID already exists")

        mentor_data = {
            "name": data.get("name", ""),
            "age": data.get("age", 0),
            "email": data.get("email", ""),
            "password": data.get("password", ""),  # ⚠️ hash in prod
            "bio": data.get("bio", ""),
            "expertise": data.get("expertise", []),
            "location": data.get("location", ""),
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(mentor_data)
        return uid

    @classmethod
    def get_profile(cls, uid: str) -> Optional[Dict]:
        """Fetch mentor profile by UID."""
        doc = db.collection(cls.COLLECTION).document(uid).get()
        return doc.to_dict() if doc.exists else None

    @classmethod
    def update_profile(cls, uid: str, updates: Dict) -> Dict:
        """Update a mentor’s profile fields."""
        updates["updated_at"] = firestore.SERVER_TIMESTAMP
        db.collection(cls.COLLECTION).document(uid).update(updates)
        return {"message": "Profile updated", "uid": uid}

    @classmethod
    def delete(cls, uid: str) -> Dict:
        """Delete mentor profile."""
        db.collection(cls.COLLECTION).document(uid).delete()
        return {"message": "Mentor deleted", "uid": uid}

    @classmethod
    def list_all(cls, limit: int = 50) -> List[Dict]:
        """List all mentors (basic info)."""
        q = db.collection(cls.COLLECTION).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def search_by_expertise(cls, expertise: str, limit: int = 20) -> List[Dict]:
        """Search mentors by area of expertise (case-insensitive)."""
        expertise_lower = expertise.lower()
        q = db.collection(cls.COLLECTION).where("expertise", "array_contains", expertise_lower).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def hydrate_entity(cls, uid: str) -> Optional[Mentor]:
        """Fetch mentor data and return a Mentor entity."""
        data = cls.get_profile(uid)
        if not data:
            return None
        return Mentor(
            uid=uid,
            name=data.get("name", ""),
            age=data.get("age", 0),
            email=data.get("email", ""),
            password=data.get("password", ""),
            bio=data.get("bio", ""),
            expertise=data.get("expertise", []),
            location=data.get("location", "")
        )
        
    # In mentorManager.py

    # ... (other methods) ...
    @classmethod
    def add_connected_artisan(cls, mentor_uid: str, artisan_uid: str):
        """Adds an artisan's UID to the mentor's connected_artisans list."""
        mentor_ref = db.collection(cls.COLLECTION).document(mentor_uid)
        mentor_ref.update({
            "connected_artisans": firestore.ArrayUnion([artisan_uid])
        })
        return {"message": "Artisan connected to mentor"}

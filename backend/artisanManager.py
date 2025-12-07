# kalasetu/artisan_manager.py
from typing import Dict, List, Optional
from firebase_config import db
from firebase_admin import firestore
from artisan import Artisan


class ArtisanManager:
    """Manager for handling Artisan collection operations in Firestore."""

    COLLECTION = "artisans"
    
    @classmethod
    def add_collaborator(cls, user_uid: str, collaborator_uid: str):
        """Adds a collaborator's UID to an artisan's profile."""
        user_ref = db.collection(cls.COLLECTION).document(user_uid)
        user_ref.update({
            "collaborators": firestore.ArrayUnion([collaborator_uid])
        })
        return {"message": "Collaborator added"}

    @classmethod
    def signup(cls, data: Dict) -> str:
        """
        Create a new artisan profile in Firestore.
        Expects: {uid, name, age, email, password, bio, skills, materials, location}
        """
        uid = data.get("uid")
        if not uid:
            raise ValueError("uid required")

        doc_ref = db.collection(cls.COLLECTION).document(uid)
        if doc_ref.get().exists:
            raise ValueError("Artisan with this UID already exists")

        artisan_data = {
            "name": data.get("name", ""),
            "age": data.get("age", 0),
            "email": data.get("email", ""),
            "password": data.get("password", ""),  # ⚠️ hash in production
            "bio": data.get("bio", ""),
            "skills": data.get("skills", []),
            "materials": data.get("materials", []),
            "location": data.get("location", ""),
            "communities": [],
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(artisan_data)
        return uid

    @classmethod
    def get_profile(cls, uid: str) -> Optional[Dict]:
        """Fetch artisan profile by UID."""
        doc = db.collection(cls.COLLECTION).document(uid).get()
        return doc.to_dict() if doc.exists else None

    @classmethod
    def update_profile(cls, uid: str, updates: Dict) -> Dict:
        """Update an artisan’s profile fields."""
        updates["updated_at"] = firestore.SERVER_TIMESTAMP
        db.collection(cls.COLLECTION).document(uid).update(updates)
        return {"message": "Profile updated", "uid": uid}

    @classmethod
    def delete(cls, uid: str) -> Dict:
        """Delete artisan profile."""
        db.collection(cls.COLLECTION).document(uid).delete()
        return {"message": "Artisan deleted", "uid": uid}

    @classmethod
    def list_all(cls, limit: int = 50) -> List[Dict]:
        """List all artisans (basic info)."""
        q = db.collection(cls.COLLECTION).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def search_by_skill(cls, skill: str, limit: int = 20) -> List[Dict]:
        """Search artisans by skill (case-insensitive)."""
        skill_lower = skill.lower()
        q = db.collection(cls.COLLECTION).where("skills", "array_contains", skill_lower).limit(limit)
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

    @classmethod
    def hydrate_entity(cls, uid: str) -> Optional[Artisan]:
        """Fetch artisan data and return an Artisan entity."""
        data = cls.get_profile(uid)
        if not data:
            return None
        return Artisan(
            uid=uid,
            name=data.get("name", ""),
            age=data.get("age", 0),
            email=data.get("email", ""),
            password=data.get("password", ""),
            bio=data.get("bio", ""),
            skills=data.get("skills", []),
            materials=data.get("materials", []),
            location=data.get("location", "")
        )
        
    # Add this new method to the ArtisanManager class in artisanManager.py

    @classmethod
    def add_business_to_profile(cls, uid: str, business_id: str):
        """Adds a business ID to the artisan's list of businesses."""
        artisan_ref = db.collection(cls.COLLECTION).document(uid)
        artisan_ref.update({
            "businesses": firestore.ArrayUnion([business_id])
        })
        return {"message": "Business linked to artisan"}
    
    # In artisanManager.py

    # ... (other methods) ...
    @classmethod
    def add_connected_mentor(cls, artisan_uid: str, mentor_uid: str):
        """Adds a mentor's UID to the artisan's connected_mentors list."""
        artisan_ref = db.collection(cls.COLLECTION).document(artisan_uid)
        artisan_ref.update({
            "connected_mentors": firestore.ArrayUnion([mentor_uid])
        })
        return {"message": "Mentor connected to artisan"}
    
    @classmethod
    def search_by_name_prefix(cls, name_prefix: str, limit: int = 10) -> List[Dict]:
        """Search for artisans where the name starts with the given prefix (case-insensitive)."""
        # Firestore's method for "starts with" queries
        start_at = name_prefix.lower()
        end_at = start_at + '\uf8ff'
        
        q = db.collection(cls.COLLECTION).where("name_lower", ">=", start_at).where("name_lower", "<=", end_at).limit(limit)
        
        return [dict(d.to_dict(), uid=d.id) for d in q.stream()]

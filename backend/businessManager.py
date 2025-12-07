# businessManager.py
from typing import Dict, List
from firebase_config import db
from firebase_admin import firestore
from artisanManager import ArtisanManager


class BusinessManager:
    """Manager for handling Business collection operations in Firestore."""

    COLLECTION = "businesses"

    @classmethod
    def create_business(cls, owner_uids: List[str], data: Dict) -> str:
        """
        Create a new business profile in Firestore with one or more owners.
        Expects: {business_name, description, category, etc.}
        """
        if not owner_uids or not data.get("business_name"):
            raise ValueError("Owner UIDs and Business Name are required.")

        doc_ref = db.collection(cls.COLLECTION).document()
        
        business_data = {
            "owner_uids": owner_uids,  # MODIFICATION: Use an array for owners
            "business_name": data.get("business_name", ""),
            "description": data.get("description", ""),
            "category": data.get("category", "other"),
            "business_type": data.get("business_type", "unregistered"),
            "established_year": data.get("established_year", None),
            "contact_email": data.get("contact_email", ""),
            "website_url": data.get("website_url", ""),
            "created_at": firestore.SERVER_TIMESTAMP,
            "status": "pending_review"
        }
        doc_ref.set(business_data)
        return doc_ref.id


    @classmethod
    def get_businesses_for_artisan(cls, owner_uid: str) -> List[Dict]:
        """Fetch all businesses where the artisan is a co-owner."""
        # MODIFICATION: Query the 'owner_uids' array instead of the old field
        q = db.collection(cls.COLLECTION).where("owner_uids", "array-contains", owner_uid).order_by("created_at")
        
        businesses = []
        for doc in q.stream():
            d = doc.to_dict()
            d["id"] = doc.id
            businesses.append(d)
            
        return businesses

    @classmethod
    def get_businesses_for_review(cls, limit: int = 50) -> List[Dict]:
        """Fetch all businesses with a 'pending_review' status."""
        q = db.collection(cls.COLLECTION).where("status", "==", "pending_review").limit(limit)
        
        businesses_to_review = []
        for doc in q.stream():
            d = doc.to_dict()
            d["id"] = doc.id
            
            # Fetch the first owner's name for display in the review UI
            owner_uid = d.get("owner_uids", [None])[0]
            if owner_uid:
                artisan_profile = ArtisanManager.get_profile(owner_uid)
                d["owner_name"] = artisan_profile.get("name", "Unknown") if artisan_profile else "Unknown"

            businesses_to_review.append(d)
        return businesses_to_review

    @classmethod
    def verify_business(cls, business_id: str, mentor_uid: str) -> Dict:
        """Update a business's status to 'verified'."""
        doc_ref = db.collection(cls.COLLECTION).document(business_id)
        if not doc_ref.get().exists:
            raise ValueError("Business not found")

        updates = {
            "status": "verified",
            "verified_by_uid": mentor_uid,
            "verified_at": firestore.SERVER_TIMESTAMP
        }
        doc_ref.update(updates)
        return {"message": "Business verified successfully", "business_id": business_id}
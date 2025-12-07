# kalasetu/marketplace_manager.py
from typing import Dict, List
from firebase_config import db
from firebase_admin import firestore


class MarketplaceManager:
    """OOP manager for handling marketplace features (onboarding, catalog, credentials)."""

    def __init__(self, uid: str):
        self.uid = uid
        self.user_ref = db.collection("users").document(uid)

    # ---------- Onboarding ----------
    def get_onboarding_checklist(self) -> List[Dict]:
        """Retrieve onboarding checklist for a user."""
        q = self.user_ref.collection("onboarding").stream()
        return [dict(doc.to_dict(), id=doc.id) for doc in q]

    def update_onboarding_step(self, step_id: str, completed: bool) -> Dict:
        """Mark a specific onboarding step as completed/incomplete."""
        step_ref = self.user_ref.collection("onboarding").document(step_id)
        step_ref.set({
            "completed": completed,
            "updated_at": firestore.SERVER_TIMESTAMP
        }, merge=True)
        return {"message": f"Step {step_id} updated", "completed": completed}

    # ---------- Catalog ----------
    def export_catalog(self) -> List[Dict]:
        """Export user’s product catalog."""
        q = self.user_ref.collection("products").stream()
        return [dict(doc.to_dict(), id=doc.id) for doc in q]

    # ---------- Marketplace Credentials ----------
    def connect_marketplace(self, platform: str, credentials: Dict) -> Dict:
        """
        Save marketplace credentials for integration (e.g. Shopify, Etsy).
        ⚠️ In production: encrypt credentials before storing.
        """
        self.user_ref.collection("marketplace_credentials").document(platform).set({
            "credentials": credentials,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        return {"message": f"Connected to {platform}"}

    def get_connected_marketplaces(self) -> List[Dict]:
        """List all connected marketplaces."""
        q = self.user_ref.collection("marketplace_credentials").stream()
        return [dict(doc.to_dict(), platform=doc.id) for doc in q]

# kalasetu/collaboration_manager.py
from typing import List, Dict
from firebase_config import db
from firebase_admin import firestore
from artisanManager import ArtisanManager


class CollaborationManager:
    """OOP manager for artisan collaboration requests."""

    def __init__(self, uid: str):
        self.uid = uid

    def send_request(self, target_uid: str, project_details: str = "") -> Dict:
        """Send a collaboration request to another artisan."""
        if not target_uid:
            raise ValueError("target_uid required")

        collab_ref = db.collection("requests").document()
        request = {
            "from_uid": self.uid,
            "to_uid": target_uid,
            "status": "pending",
            "project_details": project_details,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        collab_ref.set(request)
        return {"message": "Request sent", "request_id": collab_ref.id}

    def list_sent_requests(self) -> List[Dict]:
        """List all requests sent by this user."""
        q = db.collection("requests").where("from_uid", "==", self.uid)
        return [dict(r.to_dict(), id=r.id) for r in q.stream()]

    def list_received_requests(self) -> List[Dict]:
        """List all requests received by this user."""
        q = db.collection("requests").where("to_uid", "==", self.uid)
        return [dict(r.to_dict(), id=r.id) for r in q.stream()]

    # In collaboration_manager.py

    def update_request_status(self, request_id: str, status: str) -> Dict:
        """
        Accept or reject a collab request.
        Allowed statuses: "accepted", "rejected".
        """
        if status not in ["accepted", "rejected"]:
            raise ValueError("Invalid status. Must be 'accepted' or 'rejected'.")

        req_ref = db.collection("requests").document(request_id)
        doc = req_ref.get()
        if not doc.exists:
            raise ValueError("Request not found")

        data = doc.to_dict()
        if data["to_uid"] != self.uid:
            raise PermissionError("Not authorized to update this request")
        
        # --- FIX: Moved this block to be AFTER 'data' is defined ---
        if status == "accepted":
            sender_uid = data["from_uid"]
            receiver_uid = self.uid

            # Use ArtisanManager to update both profiles
            ArtisanManager.add_collaborator(receiver_uid, sender_uid)
            ArtisanManager.add_collaborator(sender_uid, receiver_uid)

        req_ref.update({
            "status": status,
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        return {"message": f"Request {status}", "request_id": request_id}


# mentorship_manager.py
from typing import Dict, List
from firebase_config import db
from firebase_admin import firestore
from artisanManager import ArtisanManager
from mentorManager import MentorManager

class MentorshipManager:
    """Handles the logic for mentorship requests and connections."""

    @classmethod
    def send_request(cls, artisan_uid: str, mentor_uid: str, message: str) -> Dict:
        """Creates a new mentorship request from an artisan to a mentor."""
        request_ref = db.collection("mentorship_requests").document()
        request_data = {
            "artisan_uid": artisan_uid,
            "mentor_uid": mentor_uid,
            "message": message,
            "status": "pending",
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        request_ref.set(request_data)
        return {"message": "Mentorship request sent successfully", "request_id": request_ref.id}

    @classmethod
    def get_received_requests(cls, mentor_uid: str) -> List[Dict]:
        """Fetches all pending mentorship requests for a given mentor."""
        requests_ref = db.collection("mentorship_requests").where("mentor_uid", "==", mentor_uid).where("status", "==", "pending")
        
        requests = []
        for doc in requests_ref.stream():
            request_data = doc.to_dict()
            request_data["id"] = doc.id
            # Hydrate with artisan's name for easier display on the frontend
            artisan_profile = ArtisanManager.get_profile(request_data["artisan_uid"])
            request_data["artisan_name"] = artisan_profile.get("name", "Unknown Artisan") if artisan_profile else "Unknown Artisan"
            requests.append(request_data)
        return requests

    @classmethod
    def update_request_status(cls, request_id: str, mentor_uid: str, new_status: str) -> Dict:
        """A mentor accepts or rejects a mentorship request."""
        if new_status not in ["accepted", "rejected"]:
            raise ValueError("Status must be 'accepted' or 'rejected'.")

        request_ref = db.collection("mentorship_requests").document(request_id)
        request_doc = request_ref.get()
        if not request_doc.exists:
            raise ValueError("Request not found.")
        
        request_data = request_doc.to_dict()
        if request_data["mentor_uid"] != mentor_uid:
            raise PermissionError("You are not authorized to update this request.")

        # Update the request's status
        request_ref.update({"status": new_status})

        # If accepted, create the connection between the artisan and mentor
        if new_status == "accepted":
            artisan_uid = request_data["artisan_uid"]
            ArtisanManager.add_connected_mentor(artisan_uid, mentor_uid)
            MentorManager.add_connected_artisan(mentor_uid, artisan_uid)

        return {"message": f"Request {new_status}"}
# kalasetu/chat_manager.py
from firebase_config import db
from firebase_admin import firestore
from typing import List, Dict

class ChatManager:
    """OOP wrapper for chat features, now with user verification."""

    def __init__(self, uid: str):
        self.uid = uid

    def _get_user_profile(self, user_id: str) -> dict | None:
        """Helper to fetch a user profile from ANY role collection."""
        for collection in ["artisans", "mentors", "investors"]:
            doc = db.collection(collection).document(user_id).get()
            if doc.exists:
                return doc.to_dict()
        return None

    def _verify_recipient_exists(self, recipient_uid: str) -> bool:
        """Checks if a user with the given UID exists in any user collection."""
        return self._get_user_profile(recipient_uid) is not None

    @staticmethod
    def pair_chat_id(a: str, b: str) -> str:
        u1, u2 = sorted([a, b])
        return f"dm_{u1}_{u2}"

    def send_message(
        self, recipient_uid: str, content: str,
        message_type: str = "text", audio_url: str = None
    ) -> dict:
        """Sends a message, but first verifies the recipient exists."""
        if not self._verify_recipient_exists(recipient_uid):
            raise ValueError(f"Recipient with UID '{recipient_uid}' does not exist.")

        chat_id = self.pair_chat_id(self.uid, recipient_uid)
        msg_ref = db.collection("chats").document(chat_id).collection("messages").document()
        
        message = {
            "sender_uid": self.uid, "recipient_uid": recipient_uid,
            "content": content, "message_type": message_type,
            "audio_url": audio_url, "created_at": firestore.SERVER_TIMESTAMP
        }
        msg_ref.set(message)

        my_profile = self._get_user_profile(self.uid)
        other_user_profile = self._get_user_profile(recipient_uid)

        db.collection("chat_index").document(chat_id).set({
            "participants": [self.uid, recipient_uid],
            "participant_details": {
                self.uid: {"name": my_profile.get("name", "Unknown") if my_profile else "Unknown"},
                recipient_uid: {"name": other_user_profile.get("name", "Unknown") if other_user_profile else "Unknown"}
            },
            "last_message_at": firestore.SERVER_TIMESTAMP,
            "last_sender": self.uid,
            "last_message_content": "🎤 Audio Message" if message_type == "audio" else content[:50]
        }, merge=True)

        return {"message_id": msg_ref.id, "chat_id": chat_id}

    def get_messages(self, chat_id: str, limit: int = 50) -> list[dict]:
        q = db.collection("chats").document(chat_id).collection("messages") \
            .order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        msgs = [dict(doc.to_dict(), id=doc.id) for doc in q.stream()]
        msgs.reverse()
        return msgs

    def list_conversations(self, limit: int = 100) -> list[dict]:
        idx_q = db.collection("chat_index") \
            .where("participants", "array_contains", self.uid) \
            .order_by("last_message_at", direction=firestore.Query.DESCENDING).limit(limit)
        conversations = []
        for doc in idx_q.stream():
            data = doc.to_dict()
            data["chat_id"] = doc.id
            participant_uids = data.get("participants", [])
            details = data.get("participant_details", {})
            other_user_uid = next((uid for uid in participant_uids if uid != self.uid), None)
            if other_user_uid and other_user_uid in details:
                data["other_user"] = {
                    "uid": other_user_uid,
                    "name": details[other_user_uid].get("name", "Unknown User")
                }
            conversations.append(data)
        return conversations

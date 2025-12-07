# investment_manager.py
from typing import Dict, List
from firebase_config import db
from firebase_admin import firestore

class InvestmentManager:
    """Handles logic for the investment marketplace (pitches, funding, etc.)."""

    @classmethod
    def _hydrate_investor_info(cls, investor_uids: List[str]) -> List[Dict]:
        """Helper function to fetch basic profiles for a list of investor UIDs."""
        if not investor_uids:
            return []
        investor_docs = db.collection("investors").where("__name__", "in", investor_uids).stream()
        return [{"uid": doc.id, "name": doc.to_dict().get("name", "Unknown Investor")} for doc in investor_docs]

    @classmethod
    def get_pitch_details(cls, pitch_id: str) -> Dict | None:
        """Fetches a single, detailed pitch, including hydrated investor info."""
        doc = db.collection("pitches").document(pitch_id).get()
        if not doc.exists:
            return None
        
        pitch_data = doc.to_dict()
        pitch_data["id"] = doc.id
        
        # Hydrate the list of interested investors with their names
        interested_uids = pitch_data.get("interested_investors", [])
        pitch_data["interested_investors_details"] = cls._hydrate_investor_info(interested_uids)
        
        return pitch_data
    
    @classmethod
    def create_pitch(cls, artisan_uid: str, pitch_data: Dict) -> str:
        """Creates a new pitch for a business on the marketplace."""
        business_id = pitch_data.get("business_id")
        if not business_id:
            raise ValueError("A business ID is required to create a pitch.")

        # 1. Verify that the business is eligible
        business_ref = db.collection("businesses").document(business_id)
        business_doc = business_ref.get()
        if not business_doc.exists:
            raise ValueError("Business not found.")
        
        business_data = business_doc.to_dict()
        if artisan_uid not in business_data.get("owner_uids", []):
            raise PermissionError("You must be an owner to create a pitch for this business.")
        if business_data.get("status") != "verified":
            raise PermissionError("Only businesses verified by a mentor can be pitched for funding.")

        # 2. Check for existing active pitches for this business
        existing_pitches = db.collection("pitches").where("business_id", "==", business_id).where("status", "==", "open").limit(1).stream()
        if len(list(existing_pitches)) > 0:
            raise ValueError("An active pitch for this business already exists.")

        # 3. Create the new pitch document
        new_pitch = {
            "business_id": business_id,
            "business_name": business_data.get("business_name"),
            "owner_uids": business_data.get("owner_uids"),
            "pitch_title": pitch_data.get("pitch_title"),
            "pitch_details": pitch_data.get("pitch_details"),
            "funding_goal": pitch_data.get("funding_goal", 0),
            "equity_offered": pitch_data.get("equity_offered", 0),
            "current_funding": 0,
            "interested_investors": [],
            "status": "open", # 'open', 'funded', 'closed'
            "created_at": firestore.SERVER_TIMESTAMP
        }
        pitch_ref = db.collection("pitches").document()
        pitch_ref.set(new_pitch)
        return pitch_ref.id

    @classmethod
    def list_open_pitches(cls) -> List[Dict]:
        """Lists all pitches that are open for investment."""
        q = db.collection("pitches").where("status", "==", "open").order_by("created_at", direction=firestore.Query.DESCENDING)
        pitches = []
        for doc in q.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            pitches.append(data)
        return pitches

    @classmethod
    def show_interest(cls, pitch_id: str, investor_uid: str) -> Dict:
        """Adds an investor's UID to the list of interested parties."""
        pitch_ref = db.collection("pitches").document(pitch_id)
        pitch_ref.update({
            "interested_investors": firestore.ArrayUnion([investor_uid])
        })
        return {"message": "Interest shown successfully."}

    # In investment_manager.py, REPLACE the 'make_investment' method

    @classmethod
    def make_investment(cls, pitch_id: str, investor_uid: str, amount: float) -> Dict:
        """Records an investment from an investor towards a pitch."""
        pitch_ref = db.collection("pitches").document(pitch_id)

        @firestore.transactional
        def update_in_transaction(transaction, pitch_ref_internal):
            snapshot = pitch_ref_internal.get(transaction=transaction)
            if not snapshot.exists:
                raise ValueError("Pitch not found.")
            
            pitch_data = snapshot.to_dict()

            # --- FIX: Add validation checks before processing investment ---
            if pitch_data.get("status") != "open":
                raise ValueError("This pitch is no longer open for funding.")
            
            current_funding = pitch_data.get("current_funding", 0)
            funding_goal = pitch_data.get("funding_goal", 0)

            if current_funding + amount > funding_goal:
                raise ValueError(f"This investment of ₹{amount} would exceed the funding goal of ₹{funding_goal}.")
            # --- END FIX ---

            # Create a record of this specific investment
            investment_ref = pitch_ref_internal.collection("investments").document()
            transaction.set(investment_ref, {
                "investor_uid": investor_uid,
                "amount": amount,
                "timestamp": firestore.SERVER_TIMESTAMP
            })

            # Atomically update the total funding
            transaction.update(pitch_ref_internal, {
                "current_funding": firestore.Increment(amount)
            })
            
            # Optional: Check if the goal has been met and close the pitch
            if current_funding + amount >= funding_goal:
                transaction.update(pitch_ref_internal, {"status": "funded"})

            return {"message": "Investment successful."}

        transaction = db.transaction()
        return update_in_transaction(transaction, pitch_ref)
# kalasetu/community_manager.py
from typing import List, Dict, Optional
from firebase_config import db
from firebase_admin import firestore


class CommunityManager:
    """OOP manager for artisan communities + forums."""

    def __init__(self, uid: str):
        self.uid = uid

    # ---------- Forum V2 (Reddit Style) ----------
    def get_forum_posts(self, limit: int = 20, sort_by: str = 'new') -> List[Dict]:
        """Fetch forum posts, with sorting options and author names."""
        sort_field = "score" if sort_by == 'top' else "timestamp"
        q = db.collection("forum_posts").order_by(
            sort_field, direction=firestore.Query.DESCENDING
        ).limit(limit)
        
        posts = []
        for post_doc in q.stream():
            post_data = post_doc.to_dict()
            post_data["id"] = post_doc.id
            
            # BONUS FIX: Fetch the author's name for display
            author_uid = post_data.get("author_uid")
            if author_uid:
                # This logic to find user across collections should be centralized later
                author_doc = db.collection("artisans").document(author_uid).get()
                if not author_doc.exists: author_doc = db.collection("mentors").document(author_uid).get()
                if not author_doc.exists: author_doc = db.collection("investors").document(author_uid).get()
                if author_doc.exists:
                    post_data["author_name"] = author_doc.to_dict().get("name", "Unknown")
                else:
                    post_data["author_name"] = "Unknown User"
            
            posts.append(post_data)
        return posts

    def create_forum_post(self, title: str, body: str, tags: Optional[List[str]] = None) -> Dict:
        """Create a forum post, initializing with the new voting model."""
        if not title or not body:
            raise ValueError("title and body are required")

        post = {
            "author_uid": self.uid,
            "title": title,
            "body": body,
            "tags": tags or [],
            "timestamp": firestore.SERVER_TIMESTAMP,
            "comments": [],
            # NEW VOTING MODEL: Posts start at 0 with an empty votes map.
            "votes": {},  # e.g., {"user_id_1": 1, "user_id_2": -1}
            "score": 0 
        }
        doc_ref = db.collection("forum_posts").document()
        doc_ref.set(post)
        return {"message": "Post created", "post_id": doc_ref.id}

    def vote_on_post(self, post_id: str, vote_type: str) -> Dict:
        """Atomically cast, change, or remove a vote on a post using the map model."""
        if vote_type not in ['up', 'down']:
            raise ValueError("Vote type must be 'up' or 'down'")
        
        post_ref = db.collection("forum_posts").document(post_id)

        @firestore.transactional
        def update_in_transaction(transaction, post_ref_internal):
            snapshot = post_ref_internal.get(transaction=transaction)
            if not snapshot.exists:
                raise ValueError("Post not found")
            
            post_data = snapshot.to_dict()
            votes = post_data.get("votes", {})
            
            current_vote = votes.get(self.uid, 0)  # 0=none, 1=up, -1=down
            new_vote_value = 1 if vote_type == 'up' else -1
            
            score_change = 0
            
            if current_vote == new_vote_value:
                # User is clicking the same arrow again to remove their vote
                del votes[self.uid]
                score_change = -new_vote_value # If removing upvote (+1), score changes by -1.
            else:
                # This handles both a new vote and changing an existing vote
                votes[self.uid] = new_vote_value
                score_change = new_vote_value - current_vote # e.g., switching from down(-1) to up(+1) is a +2 change.
            
            updates = {
                "votes": votes,
                "score": firestore.Increment(score_change)
            }
            
            transaction.update(post_ref_internal, updates)
            return {"message": "Vote cast successfully"}

        transaction = db.transaction()
        return update_in_transaction(transaction, post_ref)

    def delete_forum_post(self, post_id: str) -> Dict:
        """Deletes a forum post if the current user is the author."""
        post_ref = db.collection("forum_posts").document(post_id)
        post_doc = post_ref.get()
        if not post_doc.exists:
            raise ValueError("Post not found.")
        
        post_data = post_doc.to_dict()
        if post_data.get("author_uid") != self.uid:
            raise PermissionError("You are not authorized to delete this post.")
        
        post_ref.delete()
        return {"message": "Post deleted successfully"}

    # ---------- Communities V2 (Discord Style) ----------
    
    # FIX: Restored the missing list_communities method
    def list_communities(self, limit: int = 100) -> List[Dict]:
        """List communities and dynamically calculate member count for accuracy."""
        q = db.collection("communities").limit(limit)

        comms = []
        for doc in q.stream():
            d = doc.to_dict()
            d["id"] = doc.id
            # FIX: Calculate member count from the length of the members array for 100% accuracy
            d["member_count"] = len(d.get("members", []))
            comms.append(d)
        
        # Sort manually in Python after fetching
        comms.sort(key=lambda x: x['member_count'], reverse=True)
        return comms

    def get_community_details(self, community_id: str) -> Dict:
        """Get details for a single community, including its channels."""
        doc = db.collection("communities").document(community_id).get()
        if not doc.exists:
            raise ValueError("Community not found")
        return doc.to_dict()

    def create_community(self, name: str, skill_tags: List[str], description: str = "") -> Dict:
        """Create a new community with default channels."""
        if not name: raise ValueError("name required")
        comm = {
            "name": name, "skill_tags": skill_tags, "description": description,
            "member_count": 1, "members": [self.uid],
            "created_at": firestore.SERVER_TIMESTAMP,
            "channels": [
                {"id": "general", "name": "general"},
                {"id": "introductions", "name": "introductions"},
            ]
        }
        doc_ref = db.collection("communities").document()
        doc_ref.set(comm)
        return {"message": "Community created", "community_id": doc_ref.id}
    
    def post_in_channel(self, community_id: str, channel_id: str, message: str) -> Dict:
        """Create a new post within a specific channel of a community."""
        if not message: raise ValueError("Message content is required")
        post_data = {
            "author_uid": self.uid,
            "message": message,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "channel_id": channel_id
        }
        post_ref = db.collection("communities").document(community_id).collection("channel_posts").document()
        post_ref.set(post_data)
        return {"message": "Posted in channel", "post_id": post_ref.id}

    def get_channel_posts(self, community_id: str, channel_id: str, limit: int = 50) -> List[Dict]:
        """Get all posts from a specific channel, ordered by timestamp."""
        q = db.collection("communities").document(community_id).collection("channel_posts") \
            .where("channel_id", "==", channel_id) \
            .order_by("timestamp", direction=firestore.Query.ASCENDING).limit(limit)
        
        posts = []
        for doc in q.stream():
            d = doc.to_dict()
            d["id"] = doc.id
            
            # Fetch author profile to get the name
            author_profile_ref = db.collection("artisans").document(d["author_uid"])
            author_profile = author_profile_ref.get()
            if not author_profile.exists:
                 author_profile_ref = db.collection("mentors").document(d["author_uid"])
                 author_profile = author_profile_ref.get()
            if not author_profile.exists:
                 author_profile_ref = db.collection("investors").document(d["author_uid"])
                 author_profile = author_profile_ref.get()

            if author_profile.exists:
                d["author_name"] = author_profile.to_dict().get("name", "Unknown")
            else:
                d["author_name"] = "Unknown"

            posts.append(d)
        return posts
        
    def join_specific_community(self, community_id: str) -> Dict:
        """Join a specific community by ID."""
        doc_ref = db.collection("communities").document(community_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise ValueError("Community not found")
        
        doc_ref.update({
            "members": firestore.ArrayUnion([self.uid]),
            "member_count": firestore.Increment(1),
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        return {"message": "Joined community", "community_id": community_id}
    
    def list_members(self, community_id: str) -> List[Dict]:
        """List members of a community (basic user profiles)."""
        doc = db.collection("communities").document(community_id).get()
        if not doc.exists:
            raise ValueError("Community not found")

        data = doc.to_dict()
        member_uids = data.get("members", [])
        profiles = []

        # This part can be slow with many members, but is fine for this project.
        for uid in member_uids:
            # Check all possible user collections
            pdoc = db.collection("artisans").document(uid).get()
            if not pdoc.exists: pdoc = db.collection("mentors").document(uid).get()
            if not pdoc.exists: pdoc = db.collection("investors").document(uid).get()
            
            if pdoc.exists:
                d = pdoc.to_dict()
                profiles.append({"uid": uid, "name": d.get("name")})
        return profiles

    # --- Methods for Rich Profile ---
    def get_posts_by_user(self, user_uid: str, limit: int = 10) -> List[Dict]:
        """Fetch all forum posts created by a specific user."""
        q = db.collection("forum_posts").where("author_uid", "==", user_uid).order_by(
            "timestamp", direction=firestore.Query.DESCENDING
        ).limit(limit)
        posts = []
        for post_doc in q.stream():
            post_data = post_doc.to_dict()
            post_data["id"] = post_doc.id
            posts.append(post_data)
        return posts

    def get_communities_for_user(self, user_uid: str, limit: int = 10) -> List[Dict]:
        """Fetch all communities a specific user is a member of."""
        q = db.collection("communities").where("members", "array_contains", user_uid).limit(limit)
        comms = []
        for doc in q.stream():
            d = doc.to_dict()
            d["id"] = doc.id
            comms.append(d)
        return comms
    
    def leave_community(self, community_id: str) -> Dict:
        """Removes a user from a community's member list."""
        doc_ref = db.collection("communities").document(community_id)
        
        # Atomically remove the user and decrement the member count
        doc_ref.update({
            "members": firestore.ArrayRemove([self.uid]),
            "member_count": firestore.Increment(-1)
        })
        return {"message": "Successfully left community", "community_id": community_id}

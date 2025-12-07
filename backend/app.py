# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from firebase_config import db             # <<< FIX: Import the db client
from firebase_admin import firestore     # <<< FIX: Import the firestore module
from artisanManager import ArtisanManager
from mentorManager import MentorManager
from investorManager import InvestorManager
from community_manager import CommunityManager
from collaboration_manager import CollaborationManager
from chat_manager import ChatManager
from marketplaceManager import MarketplaceManager
from businessManager import BusinessManager
from firebase_client import upload_bytes_to_storage
from ai_helper import AIHelper
from mentorship_manager import MentorshipManager
from investmentManager import InvestmentManager # <<< ADD THIS IMPORT

app = Flask(__name__)
CORS(app)

# --- Mock Business and Connection Data (replace with Firestore logic) ---
# This can be removed now as we are using Firestore for businesses
# mock_businesses = {} 
mock_connections = {}

# --- Frontend Serving ---
@app.route("/")
def index():
    return render_template("index.html")
@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200
@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

# --- Auth & Profile ---
@app.route("/signup/<role>", methods=["POST"])
def signup_user(role):
    data = request.json
    uid = None
    manager = None
    if role == "artisan": manager = ArtisanManager
    elif role == "mentor": manager = MentorManager
    elif role == "investor": manager = InvestorManager
    else: return jsonify({"error": "Invalid role"}), 400
    
    uid = manager.signup(data)
    return jsonify({"message": f"{role.title()} created", "uid": uid})

@app.route("/profile/<role>/<uid>", methods=["GET", "PUT"])
def profile(role, uid):
    manager = None
    if role == "artisan": manager = ArtisanManager
    elif role == "mentor": manager = MentorManager
    elif role == "investor": manager = InvestorManager
    else: return jsonify({"error": "Invalid role"}), 400

    if request.method == "GET":
        profile_data = manager.get_profile(uid)
        if not profile_data: return jsonify({"error": "Profile not found"}), 404
        return jsonify(profile_data)
    
    if request.method == "PUT":
        updates = request.json
        if 'skills' in updates and isinstance(updates['skills'], str):
            updates['skills'] = [s.strip() for s in updates['skills'].split(',')]
        if 'expertise' in updates and isinstance(updates['expertise'], str):
            updates['expertise'] = [s.strip() for s in updates['expertise'].split(',')]
        if 'interests' in updates and isinstance(updates['interests'], str):
            updates['interests'] = [s.strip() for s in updates['interests'].split(',')]
            
        result = manager.update_profile(uid, updates)
        return jsonify(result)
    

# --- Discovery (for Mentors/Investors) ---
@app.route("/mentors/search", methods=["GET"])
def search_mentors():
    """Endpoint for artisans to discover mentors."""
    expertise = request.args.get("expertise")
    if not expertise:
        return jsonify(MentorManager.list_all(limit=20))
    return jsonify(MentorManager.search_by_expertise(expertise))

# --- Artisan AI ---
@app.route("/artisan/<uid>/ideas", methods=["GET"])
def generate_ideas(uid):
    artisan = ArtisanManager.hydrate_entity(uid)
    if not artisan: return jsonify({"error": "Artisan not found"}), 404
    try:
        ideas = artisan.generate_business_idea()
        return jsonify(ideas)
    except Exception as e:
        print(f"Error generating ideas: {e}")
        return jsonify({"error": "Failed to generate ideas from AI service."}), 500

@app.route("/artisan/<uid>/schemes", methods=["GET"])
def get_schemes_route(uid):
    artisan = ArtisanManager.hydrate_entity(uid)
    if not artisan: return jsonify({"error": "Artisan not found"}), 404
    try:
        schemes = artisan.get_schemes()
        return jsonify(schemes)
    except Exception as e:
        print(f"Error generating schemes: {e}")
        return jsonify({"error": "Failed to generate schemes from AI service."}), 500

@app.route("/artisan/<uid>/image", methods=["POST"])
def generate_image_route(uid):
    prompt = request.json.get("prompt")
    artisan = ArtisanManager.hydrate_entity(uid)
    if not artisan: return jsonify({"error": "Artisan not found"}), 404
    try:
        image_result = artisan.generate_image(prompt, upload=True)
        return jsonify(image_result)
    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": "Failed to generate image from AI service."}), 500

# --- Business Management (for Artisans) ---
@app.route("/artisan/<uid>/business", methods=["POST", "GET"])
def business_management(uid):
    if request.method == "POST":
        data = request.json
        
        # --- MODIFICATION: Combine creator and collaborators into one owner list ---
        collaborator_uids = data.get("collaborator_uids", [])
        all_owner_uids = list(set([uid] + collaborator_uids)) # Use a set to avoid duplicates
        
        # 1. Create the business profile using the new BusinessManager method
        #    The business data is passed directly to the manager now.
        business_id = BusinessManager.create_business(
            owner_uids=all_owner_uids,
            data=data
        )
        
        # 2. Link this new business ID to ALL co-owners' profiles
        for owner_uid in all_owner_uids:
            ArtisanManager.add_business_to_profile(owner_uid, business_id)
        
        return jsonify({"message": "Business created successfully", "business_id": business_id})

    if request.method == "GET":
        # This part of your code is already correct! It gets business IDs from the
        # artisan's profile, which works perfectly for the multi-owner model.
        artisan_profile = ArtisanManager.get_profile(uid)
        if not artisan_profile:
            return jsonify([])
        business_ids = artisan_profile.get("businesses", [])
        
        if not business_ids:
            return jsonify([])

        business_docs = db.collection("businesses").where("__name__", "in", business_ids).stream()
        businesses = []
        for doc in business_docs:
            business_data = doc.to_dict()
            business_data["id"] = doc.id
            businesses.append(business_data)
            
        return jsonify(businesses)
    
@app.route("/artisan/<uid>/collaborators", methods=["GET"])
def get_collaborators(uid):
    artisan_profile = ArtisanManager.get_profile(uid)
    if not artisan_profile:
        return jsonify({"error": "Artisan not found"}), 404
    
    collaborator_ids = artisan_profile.get("collaborators", [])
    if not collaborator_ids:
        return jsonify([])

    # Fetch profile for each collaborator to get their name
    collaborator_docs = db.collection("artisans").where("__name__", "in", collaborator_ids).stream()
    collaborators = []
    for doc in collaborator_docs:
        collaborator_data = doc.to_dict()
        collaborators.append({
            "uid": doc.id,
            "name": collaborator_data.get("name", "Unknown")
        })
    return jsonify(collaborators)

    
# UPDATE this route to handle deactivating associated pitches
@app.route("/business/<business_id>/deactivate", methods=["PUT"])
def deactivate_business(business_id):
    uid = request.json.get("uid")
    if not uid:
        return jsonify({"error": "User UID is required for authorization"}), 400

    business_ref = db.collection("businesses").document(business_id)
    business_doc = business_ref.get()
    if not business_doc.exists:
        return jsonify({"error": "Business not found"}), 404

    business_data = business_doc.to_dict()
    if uid not in business_data.get("owner_uids", []):
        return jsonify({"error": "You are not authorized to modify this business"}), 403

    # Set the business status to inactive
    business_ref.update({"status": "inactive"})
    
    # --- NEW LOGIC: Also deactivate any associated marketplace pitches ---
    pitches_ref = db.collection("pitches").where("business_id", "==", business_id).where("status", "==", "open")
    for pitch in pitches_ref.stream():
        pitch.reference.update({"status": "closed_deactivated"})
    
    return jsonify({"message": "Business and any associated pitches have been deactivated", "business_id": business_id})

# --- Community & Forum V2 ---
@app.route("/forum/posts", methods=["GET"])
def get_forum_posts():
    sort_by = request.args.get("sort_by", 'new') # Default to 'new'
    cm = CommunityManager(uid="global_user") 
    return jsonify(cm.get_forum_posts(sort_by=sort_by))

# In app.py, add this new route
@app.route("/forum/post", methods=["POST"])
def create_forum_post_route():
    data = request.json
    uid = data.get("uid")
    if not uid:
        return jsonify({"error": "UID is required to create a post"}), 400
    
    cm = CommunityManager(uid)
    try:
        # The frontend sends 'content', the manager expects 'content'
        result = cm.create_forum_post(data.get("title"), data.get("content"))
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/forum/post/<post_id>/vote", methods=["POST"])
def vote_on_post_route(post_id):
    uid = request.json.get("uid") 
    vote_type = request.json.get("vote_type")
    if not uid: return jsonify({"error": "UID is required"}), 400
    
    cm = CommunityManager(uid=uid)
    try:
        result = cm.vote_on_post(post_id, vote_type)
        return jsonify(result)
    # FIX: Catch specific errors to provide better feedback
    except ValueError as e:
        return jsonify({"error": str(e)}), 404 # Use 404 for "Not Found"
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403 # Use 403 for "Forbidden"
    except Exception as e:
        print(f"Error during vote: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500
    
# Add the new DELETE route for forum posts
@app.route("/forum/post/<post_id>", methods=["DELETE"])
def delete_forum_post_route(post_id):
    uid = request.json.get("uid")
    if not uid: return jsonify({"error": "UID is required"}), 400

    cm = CommunityManager(uid=uid)
    try:
        result = cm.delete_forum_post(post_id)
        return jsonify(result)
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route("/communities/list", methods=["GET"])
def list_communities():
    cm = CommunityManager(uid="global_user")
    return jsonify(cm.list_communities())

@app.route("/community/<uid>/post", methods=["POST"])
def forum_post(uid):
    data = request.json
    cm = CommunityManager(uid)
    return jsonify(cm.create_forum_post(data["title"], data["content"]))

@app.route("/community/<uid>/join/<community_id>", methods=["POST"])
def join_community(uid, community_id):
    cm = CommunityManager(uid)
    try:
        return jsonify(cm.join_specific_community(community_id))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/community/<community_id>/members", methods=["GET"])
def get_community_members(community_id):
    cm = CommunityManager(uid="global_user")
    try:
        return jsonify(cm.list_members(community_id))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- Collaboration ---
@app.route("/collab/<uid>/send", methods=["POST"])
def send_collab(uid):
    data = request.json
    cm = CollaborationManager(uid)
    return jsonify(cm.send_request(data["to_id"], data["message"]))

# In app.py, replace the get_collab_requests function with this one

@app.route("/collab/<uid>/requests", methods=["GET"])
def get_collab_requests(uid):
    cm = CollaborationManager(uid)
    
    received_requests_raw = cm.list_received_requests()
    sent_requests_raw = cm.list_sent_requests()

    # --- THIS IS THE CRUCIAL LOGIC THAT LOOKS UP USER NAMES ---
    all_uids_needed = set()
    for req in received_requests_raw:
        all_uids_needed.add(req.get("from_uid"))
    for req in sent_requests_raw:
        all_uids_needed.add(req.get("to_uid"))
    
    user_profiles = {}
    uid_list = list(all_uids_needed)

    if uid_list:
        # Query all three user collections to find the names, regardless of role.
        collections_to_search = ["artisans", "mentors", "investors"]
        for collection_name in collections_to_search:
            # Note: Firestore 'in' query is limited to 30 items.
            user_docs = db.collection(collection_name).where("__name__", "in", uid_list).stream()
            for doc in user_docs:
                if doc.id not in user_profiles:
                    user_profiles[doc.id] = doc.to_dict().get("name", "Unknown User")
            
    # Add the found names to the request objects before sending
    for req in received_requests_raw:
        req["from_name"] = user_profiles.get(req.get("from_uid"), "Unknown")
        
    for req in sent_requests_raw:
        req["to_name"] = user_profiles.get(req.get("to_uid"), "Unknown")

    return jsonify({
        "received": received_requests_raw,
        "sent": sent_requests_raw
    })

@app.route("/collab/<uid>/update/<request_id>", methods=["PUT"])
def update_collab(uid, request_id):
    status = request.json.get("status")
    cm = CollaborationManager(uid)
    try:
        return jsonify(cm.update_request_status(request_id, status))
    except Exception as e:
        return jsonify({"error": str(e)}), 403

# --- Discovery (for Mentors/Investors) ---
@app.route("/artisans/search", methods=["GET"])
def search_artisans():
    skill = request.args.get("skill")
    if not skill:
        return jsonify(ArtisanManager.list_all(limit=20))
    return jsonify(ArtisanManager.search_by_skill(skill))

# --- Chat ---
@app.route("/chat/<uid>/conversations", methods=["GET"])
def list_conversations_route(uid):
    cm = ChatManager(uid)
    return jsonify(cm.list_conversations())

@app.route("/chat/<uid>/send", methods=["POST"])
def send_message_route(uid):
    """Handles sending ALL messages (text and audio initiation)."""
    data = request.json
    try:
        cm = ChatManager(uid)
        result = cm.send_message(
            recipient_uid=data["to_id"],
            # FIX: The backend now correctly looks for 'content' to match the frontend
            content=data["content"]
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        print(f"Error in send_message_route: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route("/chat/<uid>/send_audio", methods=["POST"])
def send_audio_message_route(uid):
    """Handles sending subsequent audio file messages."""
    if 'audio_data' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    file = request.files['audio_data']
    recipient_uid = request.form.get('to_id')
    if not file or not recipient_uid:
        return jsonify({"error": "Missing audio file or recipient ID"}), 400
    try:
        audio_bytes = file.read()
        ai = AIHelper()
        transcribed_text = ai.speech_to_text(audio_bytes) or "(Audio message)"
        filename = f"chats/{uid}/{recipient_uid}/{firestore.SERVER_TIMESTAMP}.mp3"
        audio_url = upload_bytes_to_storage(filename, audio_bytes, file.content_type)
        cm = ChatManager(uid)
        result = cm.send_message(
            recipient_uid=recipient_uid, content=transcribed_text,
            message_type="audio", audio_url=audio_url
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Server failed to process audio message"}), 500

@app.route("/chat/<uid>/get/<chat_id>", methods=["GET"])
def get_chat_messages_route(uid, chat_id):
    cm = ChatManager(uid)
    return jsonify(cm.get_messages(chat_id))

# (Marketplace and Investor routes remain the same)
@app.route("/marketplace/<uid>/catalog", methods=["GET"])
def catalog(uid):
    mp = MarketplaceManager(uid)
    return jsonify(mp.export_catalog())

@app.route("/investor/<uid>/fund", methods=["POST"])
def fund_artisan(uid):
    data = request.json
    return jsonify({"message": f"Investor {uid} funded artisan {data['artisan_id']}"})

# NEW ROUTES for the rich profile page
@app.route("/user/<uid>/posts", methods=["GET"])
def get_user_posts(uid):
    cm = CommunityManager(uid)
    posts = cm.get_posts_by_user(uid)
    return jsonify(posts)

@app.route("/user/<uid>/communities", methods=["GET"])
def get_user_communities(uid):
    cm = CommunityManager(uid)
    communities = cm.get_communities_for_user(uid)
    return jsonify(communities)

# In app.py, add this new route

@app.route("/community/<uid>/create", methods=["POST"])
def create_community_route(uid):
    # Ensure the user is a mentor before allowing creation
    mentor_profile = MentorManager.get_profile(uid)
    if not mentor_profile:
        return jsonify({"error": "Only mentors can create communities"}), 403

    data = request.json
    cm = CommunityManager(uid)
    try:
        result = cm.create_community(
            name=data.get("name"),
            skill_tags=data.get("skill_tags", []),
            description=data.get("description", "")
        )
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# --- Mentor Features ---
@app.route("/mentor/review", methods=["GET"])
def get_businesses_for_review():
    """Endpoint for mentors to get a list of businesses to review."""
    try:
        businesses = BusinessManager.get_businesses_for_review()
        return jsonify(businesses)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/mentor/<uid>/verify/<business_id>", methods=["POST"])
def verify_business_route(uid, business_id):
    """Endpoint for a mentor to verify a business."""
    # The uid from the URL confirms which mentor is taking the action
    try:
        result = BusinessManager.verify_business(business_id, mentor_uid=uid)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ... (existing routes) ...
# NEW Community V2 routes
@app.route("/community/<community_id>", methods=["GET"])
def get_community_details_route(community_id):
    cm = CommunityManager("global_user")
    try:
        details = cm.get_community_details(community_id)
        return jsonify(details)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@app.route("/community/<community_id>/<channel_id>/posts", methods=["GET", "POST"])
def channel_posts_route(community_id, channel_id):
    if request.method == "GET":
        cm = CommunityManager("global_user")
        posts = cm.get_channel_posts(community_id, channel_id)
        return jsonify(posts)

    if request.method == "POST":
        uid = request.json.get("uid")
        message = request.json.get("message")
        if not uid or not message:
            return jsonify({"error": "UID and message are required"}), 400
        
        cm = CommunityManager(uid)
        result = cm.post_in_channel(community_id, channel_id, message)
        return jsonify(result)
    
@app.route("/community/<uid>/leave/<community_id>", methods=["POST"])
def leave_community_route(uid, community_id):
    cm = CommunityManager(uid)
    try:
        return jsonify(cm.leave_community(community_id))
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    
# In app.py

# --- Mentorship Features ---

@app.route("/mentor/request", methods=["POST"])
def send_mentorship_request():
    """Endpoint for an artisan to send a mentorship request."""
    data = request.json
    try:
        result = MentorshipManager.send_request(
            artisan_uid=data.get("artisan_uid"),
            mentor_uid=data.get("mentor_uid"),
            message=data.get("message")
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/mentor/<uid>/requests", methods=["GET"])
def get_mentorship_requests(uid):
    """Endpoint for a mentor to get their pending requests."""
    try:
        requests = MentorshipManager.get_received_requests(mentor_uid=uid)
        return jsonify(requests)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/mentor/request/<request_id>", methods=["PUT"])
def update_mentorship_request(request_id):
    """Endpoint for a mentor to accept or reject a request."""
    data = request.json
    try:
        result = MentorshipManager.update_request_status(
            request_id=request_id,
            mentor_uid=data.get("mentor_uid"),
            new_status=data.get("status")
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/mentor/<uid>/artisans", methods=["GET"])
def get_connected_artisans(uid):
    """Endpoint for a mentor to get their list of connected artisans."""
    mentor_profile = MentorManager.get_profile(uid)
    artisan_ids = mentor_profile.get("connected_artisans", [])
    if not artisan_ids: return jsonify([])
    
    artisans = [ArtisanManager.get_profile(artisan_id) for artisan_id in artisan_ids]
    # Add UID to each profile for the frontend
    for i, artisan in enumerate(artisans):
        if artisan: artisan['uid'] = artisan_ids[i]
        
    return jsonify([a for a in artisans if a is not None])

@app.route("/artisan/<uid>/mentors", methods=["GET"])
def get_connected_mentors(uid):
    """Endpoint for an artisan to get their list of connected mentors."""
    artisan_profile = ArtisanManager.get_profile(uid)
    mentor_ids = artisan_profile.get("connected_mentors", [])
    if not mentor_ids: return jsonify([])

    mentors = [MentorManager.get_profile(mentor_id) for mentor_id in mentor_ids]
    for i, mentor in enumerate(mentors):
        if mentor: mentor['uid'] = mentor_ids[i]

    return jsonify([m for m in mentors if m is not None])

# --- Marketplace Routes ---
# ADD this new route to get a single pitch's details
@app.route("/marketplace/pitch/<pitch_id>", methods=["GET"])
def get_pitch_details_route(pitch_id):
    try:
        pitch = InvestmentManager.get_pitch_details(pitch_id)
        if pitch:
            return jsonify(pitch)
        return jsonify({"error": "Pitch not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/marketplace/pitches", methods=["GET"])
def list_pitches_route():
    try:
        pitches = InvestmentManager.list_open_pitches()
        return jsonify(pitches)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/marketplace/pitch", methods=["POST"])
def create_pitch_route():
    data = request.json
    uid = data.get("uid") # Artisan's UID
    if not uid: return jsonify({"error": "UID is required"}), 400
    try:
        pitch_id = InvestmentManager.create_pitch(uid, data)
        return jsonify({"message": "Pitch created successfully", "pitch_id": pitch_id})
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route("/marketplace/pitch/<pitch_id>/interest", methods=["POST"])
def show_interest_route(pitch_id):
    investor_uid = request.json.get("uid")
    if not investor_uid: return jsonify({"error": "Investor UID is required"}), 400
    try:
        result = InvestmentManager.show_interest(pitch_id, investor_uid)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/marketplace/pitch/<pitch_id>/fund", methods=["POST"])
def fund_pitch_route(pitch_id):
    investor_uid = request.json.get("uid")
    amount = request.json.get("amount")
    if not investor_uid or not amount:
        return jsonify({"error": "Investor UID and amount are required"}), 400
    try:
        result = InvestmentManager.make_investment(pitch_id, investor_uid, float(amount))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
# --- User Search ---
@app.route("/users/search", methods=["GET"])
def search_users_by_name():
    """Endpoint for searching users by name prefix."""
    name_prefix = request.args.get("name")
    if not name_prefix:
        return jsonify({"error": "A 'name' query parameter is required."}), 400
    
    # For now, this only searches artisans. Can be expanded to search mentors/investors.
    artisans = ArtisanManager.search_by_name_prefix(name_prefix)
    return jsonify(artisans)

if __name__ == "__main__":

    app.run(debug=True, port=5000)

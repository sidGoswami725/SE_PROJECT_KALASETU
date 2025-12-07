// static/api.js
const API_BASE = "http://127.0.0.1:5000";

async function apiFetch(path: string, method: string = "GET", body: any = null) {
  // Define the type for our options object. RequestInit is a built-in type.
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "API error");
  }
  return res.status === 204 ? null : await res.json();
}

// --- Auth & Profile ---
export function signup(role, data) {
  return apiFetch(`/signup/${role}`, "POST", data);
}
export function getProfile(role, uid) {
  return apiFetch(`/profile/${role}/${uid}`);
}
export function updateProfile(role, uid, data) {
  return apiFetch(`/profile/${role}/${uid}`, "PUT", data);
}

// --- Artisan AI ---
export function getIdeas(uid) {
  return apiFetch(`/artisan/${uid}/ideas`);
}
export function getSchemes(uid) {
  return apiFetch(`/artisan/${uid}/schemes`);
}
export function generateImage(uid, prompt) {
  return apiFetch(`/artisan/${uid}/image`, "POST", { prompt });
}

// --- Business ---
export function getBusinesses(uid) {
    return apiFetch(`/artisan/${uid}/business`);
}
export function createBusiness(uid, data) {
    return apiFetch(`/artisan/${uid}/business`, "POST", data);
}
export function deactivateBusiness(businessId, uid) {
    return apiFetch(`/business/${businessId}/deactivate`, "PUT", { uid });
}


// --- Community & Forum ---
export function getForumPosts(sortBy = 'new') {
    return apiFetch(`/forum/posts?sort_by=${sortBy}`);
}
export function voteOnPost(postId, uid, voteType) {
    return apiFetch(`/forum/post/${postId}/vote`, "POST", { uid, vote_type: voteType });
}
export function deleteForumPost(postId, uid) {
    return apiFetch(`/forum/post/${postId}`, "DELETE", { uid });
}
export function createForumPost(uid, data) {
    return apiFetch(`/forum/post`, "POST", { ...data, uid });
}
export function listCommunities() {
    return apiFetch(`/communities/list`);
}
export function getCommunityDetails(communityId) {
    return apiFetch(`/community/${communityId}`);
}
export function getChannelPosts(communityId, channelId) {
    return apiFetch(`/community/${communityId}/${channelId}/posts`);
}
export function postInChannel(communityId, channelId, uid, message) {
    return apiFetch(`/community/${communityId}/${channelId}/posts`, "POST", { uid, message });
}
export function joinCommunity(uid, communityId) {
    return apiFetch(`/community/${uid}/join/${communityId}`, "POST");
}
export function leaveCommunity(uid, communityId) {
    return apiFetch(`/community/${uid}/leave/${communityId}`, "POST");
}
export function getCommunityMembers(communityId) {
    return apiFetch(`/community/${communityId}/members`);
}
export function createCommunity(uid: string, data: object): Promise<any> {
    return apiFetch(`/community/${uid}/create`, "POST", data);
}


// --- Collaboration ---
export function sendCollab(uid, to_id, message) {
  return apiFetch(`/collab/${uid}/send`, "POST", { to_id, message });
}
export function getCollabRequests(uid) {
  return apiFetch(`/collab/${uid}/requests`);
}
export function updateCollabStatus(uid, requestId, status) {
    return apiFetch(`/collab/${uid}/update/${requestId}`, "PUT", { status });
}
export function getCollaborators(uid) {
  return apiFetch(`/artisan/${uid}/collaborators`);
}


// --- Discovery & User Search ---
export function searchArtisans(skill = "") {
    return apiFetch(`/artisans/search?skill=${skill}`);
}
export function searchMentors(expertise = "") {
  return apiFetch(`/mentors/search?expertise=${expertise}`);
}
// FIX: The duplicate function has been removed. This is the single, correct version.
export function searchUsers(name) {
    return apiFetch(`/users/search?name=${encodeURIComponent(name)}`);
}


// --- Chat ---
export function getConversations(uid) {
  return apiFetch(`/chat/${uid}/conversations`);
}
export function sendMessage(uid, to_id, message) {
  return apiFetch(`/chat/${uid}/send`, "POST", { to_id, content: message });
}
export function getChat(uid, chat_id) {
  return apiFetch(`/chat/${uid}/get/${chat_id}`);
}


// --- Rich Profile ---
export function getUserPosts(uid) {
    return apiFetch(`/user/${uid}/posts`);
}
export function getUserCommunities(uid) {
    return apiFetch(`/user/${uid}/communities`);
}


// --- Mentorship ---
export function getBusinessesToReview() {
  return apiFetch(`/mentor/review`);
}
export function verifyBusiness(uid, businessId) {
  return apiFetch(`/mentor/${uid}/verify/${businessId}`, "POST");
}
export function sendMentorshipRequest(artisan_uid, mentor_uid, message) {
  return apiFetch(`/mentor/request`, "POST", { artisan_uid, mentor_uid, message });
}
export function getMentorshipRequests(mentor_uid) {
  return apiFetch(`/mentor/${mentor_uid}/requests`);
}
export function updateMentorshipRequestStatus(request_id, mentor_uid, status) {
  return apiFetch(`/mentor/request/${request_id}`, "PUT", { mentor_uid, status });
}
export function getConnectedArtisans(mentor_uid) {
  return apiFetch(`/mentor/${mentor_uid}/artisans`);
}
export function getConnectedMentors(artisan_uid) {
  return apiFetch(`/artisan/${artisan_uid}/mentors`);
}


// --- Marketplace & Investing ---
export function getInvestmentOpportunities() {
  return apiFetch(`/investor/opportunities`);
}
export function listPitches() {
    return apiFetch(`/marketplace/pitches`);
}
export function getPitchDetails(pitchId) {
    return apiFetch(`/marketplace/pitch/${pitchId}`);
}
export function createPitch(uid, pitchData) {
    pitchData.uid = uid;
    return apiFetch(`/marketplace/pitch`, "POST", pitchData);
}
export function showInterestInPitch(pitchId, investorUid) {
    return apiFetch(`/marketplace/pitch/${pitchId}/interest`, "POST", { uid: investorUid });
}
export function fundPitch(pitchId, investorUid, amount) {
    return apiFetch(`/marketplace/pitch/${pitchId}/fund`, "POST", { uid: investorUid, amount });
}
# kalasetu/user.py
from typing import List, Dict, Optional


class User:
    def __init__(self, uid: str, name: str, age: int, email: str, password: str,
                 role: str, bio: str = "", skills: Optional[List[str]] = None,
                 location: str = ""):
        self.uid = uid
        self.name = name
        self.age = age
        self.email = email
        self.password = password   # NOTE: should be hashed in real apps
        self.role = role
        self.bio = bio
        self.skills = skills or []
        self.location = location
        self.communities = []
        self.messages = []
        self.notifications = []

    # ----- Common Methods -----
    def signup(self):
        return f"{self.role.title()} {self.name} signed up with email {self.email}"

    def login(self, email: str, password: str):
        if self.email == email and self.password == password:
            return f"{self.name} logged in successfully"
        return "Invalid credentials"

    def view_profile(self) -> Dict:
        return {
            "uid": self.uid,
            "name": self.name,
            "age": self.age,
            "email": self.email,
            "role": self.role,
            "bio": self.bio,
            "skills": self.skills,
            "location": self.location,
            "communities": self.communities
        }

    def update_profile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return f"Profile updated for {self.name}"

    def search_users(self, users: List['User'], skill: Optional[str] = None, role: Optional[str] = None):
        results = []
        for u in users:
            if skill and skill not in u.skills:
                continue
            if role and role != u.role:
                continue
            results.append(u.view_profile())
        return results

    def chat(self, receiver: 'User', message: str):
        self.messages.append((receiver.uid, message))
        receiver.messages.append((self.uid, message))
        return f"Message sent from {self.name} to {receiver.name}"

    def access_forum(self, community: str, message: str):
        return f"{self.name} posted in {community} forum: {message}"

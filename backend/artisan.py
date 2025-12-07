# kalasetu/artisan.py
from typing import List, Dict, Optional
from user import User
from ai_helper import AIHelper

class Artisan(User):
    def __init__(self, uid: str, name: str, age: int, email: str, password: str,
                 bio: str = "", skills: Optional[List[str]] = None,
                 materials: Optional[List[str]] = None,
                 location: str = ""):
        super().__init__(uid, name, age, email, password,
                         role="artisan", bio=bio, skills=skills, location=location)

        # Artisan-specific fields
        self.materials = materials or []
        self.portfolio: List[Dict] = []            # list of products/projects
        self.business_ideas: List[str] = []        # generated ideas
        self.mentors_connected: List[str] = []     # mentor IDs
        self.investors_interested: List[str] = []  # investor IDs

        # Attach AI helper instance
        self.ai = AIHelper()

    # ----------------- Communities -----------------
    def view_communities(self, available: Dict[str, List[str]]) -> List[str]:
        """
        Return list of communities the artisan can join based on skills.
        available = {community_name: required_skills}
        """
        return [c for c, req_skills in available.items()
                if any(skill in self.skills for skill in req_skills)]

    def join_community(self, community: str) -> str:
        if community not in self.communities:
            self.communities.append(community)
        return f"{self.name} joined {community} community"

    def collaborate(self, artisan: 'Artisan') -> str:
        return f"{self.name} is collaborating with {artisan.name}"

    # ----------------- AI Features -----------------
    def generate_business_idea(self) -> List[str]:
        """Generate business ideas from artisan’s skills + materials."""
        ideas = self.ai.generate_ideas(self.skills, self.materials)
        self.business_ideas.extend(ideas)
        return ideas

    def text_to_speech(self, text: str, language_code: str = "en-IN") -> Optional[bytes]:
        """Convert text to speech (MP3 bytes)."""
        return self.ai.text_to_speech(text, language_code)

    def speech_to_text(self, audio_bytes: bytes) -> str:
        """Convert audio bytes to text."""
        return self.ai.speech_to_text(audio_bytes)

    def generate_image(self, description: str, upload: bool = False, path: Optional[str] = None) -> Dict:
        """Generate an image (e.g., product mockup)."""
        return self.ai.generate_image(description, upload, path)

    def get_schemes(self) -> List[Dict]:
        """Fetch relevant schemes based on artisan profile."""
        profile = {
            "location": self.location,
            "skills": self.skills,
            "bio": self.bio
        }
        return self.ai.get_schemes(profile)


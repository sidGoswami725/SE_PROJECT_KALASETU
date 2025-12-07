# kalasetu/mentor.py
from typing import List
from user import User
from artisan import Artisan


class Mentor(User):
    def __init__(self, uid: str, name: str, age: int, email: str, password: str,
                 expertise: List[str], bio: str = "", location: str = ""):
        super().__init__(uid, name, age, email, password, role="mentor",
                         bio=bio, skills=expertise, location=location)
        self.expertise = expertise
        self.mentees = []
        self.availability = "Available"

    def view_artisans(self, users: List[User]):
        return [u.view_profile() for u in users if u.role == "artisan"]

    def connect_with_artisan(self, artisan: Artisan):
        self.mentees.append(artisan.uid)
        artisan.mentors_connected.append(self.uid)
        return f"{self.name} connected with artisan {artisan.name}"

    def guide_artisan(self, artisan: Artisan, advice: str):
        return f"Mentor {self.name} guided {artisan.name}: {advice}"

    def host_session(self, topic: str):
        return f"Mentor {self.name} hosted a session on {topic}"

    def evaluate_artisan(self, artisan: Artisan):
        return f"Evaluation for {artisan.name}: Strong skills in {', '.join(artisan.skills)}"

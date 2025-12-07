# kalasetu/investor.py
from typing import List
from user import User
from artisan import Artisan


class Investor(User):
    def __init__(self, uid: str, name: str, age: int, email: str, password: str,
                 funding_capacity: float, interests: List[str], bio: str = "", location: str = ""):
        super().__init__(uid, name, age, email, password, role="investor",
                         bio=bio, skills=interests, location=location)
        self.funding_capacity = funding_capacity
        self.portfolio = []
        self.interests = interests

    def discover_artisans(self, users: List[User]):
        return [u.view_profile() for u in users
                if u.role == "artisan" and any(skill in self.interests for skill in u.skills)]

    def fund_artisan(self, artisan: Artisan, amount: float):
        if amount > self.funding_capacity:
            return f"Insufficient funds. Available: {self.funding_capacity}"
        self.funding_capacity -= amount
        self.portfolio.append({"artisan": artisan.uid, "amount": amount})
        artisan.investors_interested.append(self.uid)
        return f"Investor {self.name} funded {amount} to {artisan.name}. Remaining capacity: {self.funding_capacity}"

    def track_investment(self):
        return f"{self.name}'s portfolio: {self.portfolio}"

    def connect_with_artisan(self, artisan: Artisan):
        return f"Investor {self.name} connected with artisan {artisan.name}"

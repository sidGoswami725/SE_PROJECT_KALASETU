# kalasetu/ai_helper.py
import logging
from typing import List, Dict, Any, Optional
import re
import time

from ai_clients import (
    generate_product_ideas,
    speech_to_text,
    text_to_speech,
    generate_mockup_image,
    upload_image_to_storage,
    embed_text,
    get_government_schemes,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class AIHelper:
    """OOP wrapper around ai_clients functions with consistent error handling."""

    def generate_ideas(self, skills: List[str], materials: List[str]) -> List[str]:
        """Generate product ideas using skills + materials."""
        try:
            return generate_product_ideas(skills, materials)
        except Exception as e:
            logger.error(f"generate_ideas failed: {e}")
            return []

    def speech_to_text(self, audio_bytes: bytes) -> str:
        """Convert speech audio into text."""
        try:
            return speech_to_text(audio_bytes)
        except Exception as e:
            logger.error(f"speech_to_text failed: {e}")
            return "Transcription failed."

    def text_to_speech(self, text: str, language_code: str = "en-IN") -> Optional[bytes]:
        """Convert text into speech (returns MP3 audio bytes)."""
        if not text:
            logger.warning("text_to_speech called with empty text.")
            return None
        try:
            return text_to_speech(text, language_code)
        except Exception as e:
            logger.error(f"text_to_speech failed: {e}")
            return None

    def generate_image(self, description: str, upload: bool = False, path: Optional[str] = None) -> Dict[str, Any]:
        """Generate an image for a description, optionally upload to Firebase."""
        if not description:
            return {"error": "Description required."}

        result = {}
        try:
            result = generate_mockup_image(description)
            img_bytes = result.get("image_bytes")
            if not img_bytes:
                return {"error": f"Image generation failed: {result.get('notes', '')}"}

            if upload:
                try:
                    # ---- FIX STARTS HERE: Sanitize filename ----
                    # Sanitize the description to create a safe filename
                    safe_desc = re.sub(r'[^a-zA-Z0-9_]', '', description.replace(' ', '_'))
                    # Truncate to a reasonable length and add a timestamp for uniqueness
                    safe_filename = f"{safe_desc[:50]}_{int(time.time())}.png"
                    path = path or f"mockups/{safe_filename}"
                    # ---- FIX ENDS HERE ----
                    
                    url = upload_image_to_storage(path, img_bytes, result.get("mime", "image/png"))
                    result["url"] = url
                except Exception as e:
                    logger.error(f"Image upload failed: {e}")
                    result["upload_error"] = str(e)

            return result
        except Exception as e:
            logger.error(f"generate_image failed: {e}")
            return {"error": str(e)}
        finally:
            # ---- FIX STARTS HERE: Always remove image bytes ----
            # This 'finally' block ensures image_bytes are always removed before returning.
            if "image_bytes" in result:
                del result["image_bytes"]
            # ---- FIX ENDS HERE ----
            
    def embed_text(self, text: str) -> List[float]:
        """Get embeddings for text."""
        if not text:
            return []
        try:
            return embed_text(text)
        except Exception as e:
            logger.error(f"embed_text failed: {e}")
            return []

    def get_schemes(self, profile: dict) -> List[Dict[str, Any]]:
        """Fetch relevant government schemes for a profile."""
        try:
            return get_government_schemes(profile)
        except Exception as e:
            logger.error(f"get_schemes failed: {e}")
            return []


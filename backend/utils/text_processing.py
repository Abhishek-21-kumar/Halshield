"""
HalShield — Text processing utilities.
Sentence splitting, text cleaning, and claim extraction.
"""
import re
from typing import List


def split_into_sentences(text: str) -> list[str]:
    """
    Split text into individual sentences using regex-based rules.
    Falls back to period splitting if NLTK/spaCy aren't available.
    """
    try:
        import nltk
        nltk.download("punkt_tab", quiet=True)
        from nltk.tokenize import sent_tokenize
        sentences = sent_tokenize(text)
    except Exception:
        # Fallback: regex-based sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+', text)

    # Filter out empty or very short fragments
    return [s.strip() for s in sentences if len(s.strip()) > 10]


def clean_text(text: str) -> str:
    """Remove excessive whitespace and normalize text."""
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text


def extract_claims(text: str) -> list[str]:
    """
    Extract individual claims/facts from a text passage.
    Each sentence is treated as a separate claim for verification.
    """
    sentences = split_into_sentences(clean_text(text))
    return sentences


def truncate(text: str, max_length: int = 512) -> str:
    """Truncate text to max_length characters."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."

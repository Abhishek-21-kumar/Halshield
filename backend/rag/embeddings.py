"""
HalShield — Embedding generation using Sentence Transformers.
Generates dense vector embeddings for text chunks and queries.
"""
import numpy as np
from config import settings

# Lazy-loaded model instance
_model = None


def get_model():
    """Load the sentence transformer model (singleton)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate embeddings for a list of text strings.

    Args:
        texts: List of text strings to embed.

    Returns:
        NumPy array of shape (n_texts, embedding_dim).
    """
    model = get_model()
    embeddings = model.encode(
        texts,
        show_progress_bar=False,
        batch_size=32,
        normalize_embeddings=True,
    )
    return np.array(embeddings, dtype=np.float32)


def generate_single_embedding(text: str) -> np.ndarray:
    """Generate embedding for a single text string."""
    model = get_model()
    embedding = model.encode(
        [text],
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return np.array(embedding, dtype=np.float32)

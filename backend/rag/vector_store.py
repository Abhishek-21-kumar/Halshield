"""
HalShield — FAISS vector store wrapper.
Manages document indexing, persistence, and similarity search.
"""
import os
import json
import numpy as np
from typing import Optional

from config import settings
from rag.embeddings import generate_embeddings, generate_single_embedding

# Lazy import
_faiss = None


def _get_faiss():
    global _faiss
    if _faiss is None:
        import faiss
        _faiss = faiss
    return _faiss


class VectorStore:
    """FAISS-backed vector store for document chunks."""

    def __init__(self, index_path: str | None = None):
        self.index_path = index_path or settings.FAISS_INDEX_PATH
        self.index = None
        self.documents: list[dict] = []  # Stores {"text": ..., "source": ...}
        self._metadata_path = os.path.join(self.index_path, "metadata.json")
        self._index_file = os.path.join(self.index_path, "index.faiss")
        self._load_existing()

    def _load_existing(self):
        """Load existing FAISS index and metadata from disk."""
        faiss = _get_faiss()
        if os.path.exists(self._index_file) and os.path.exists(self._metadata_path):
            try:
                self.index = faiss.read_index(self._index_file)
                with open(self._metadata_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception:
                self.index = None
                self.documents = []

    def add_documents(self, texts: list[str], source: str = "unknown") -> int:
        """
        Add text chunks to the vector store.

        Args:
            texts: List of text chunks.
            source: Source identifier (e.g., filename).

        Returns:
            Number of chunks added.
        """
        if not texts:
            return 0

        faiss = _get_faiss()

        # Generate embeddings
        embeddings = generate_embeddings(texts)
        dim = embeddings.shape[1]

        # Create or extend index
        if self.index is None:
            self.index = faiss.IndexFlatIP(dim)  # Inner product (cosine for normalized vecs)

        self.index.add(embeddings)

        # Store metadata
        for text in texts:
            self.documents.append({"text": text, "source": source})

        # Persist
        self._save()

        return len(texts)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """
        Search for the most similar documents to the query.

        Args:
            query: Search query text.
            top_k: Number of results to return.

        Returns:
            List of dicts with 'text', 'source', and 'score' keys.
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        query_embedding = generate_single_embedding(query)
        top_k = min(top_k, self.index.ntotal)

        scores, indices = self.index.search(query_embedding, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents) and idx >= 0:
                doc = self.documents[idx].copy()
                doc["score"] = float(score)
                results.append(doc)

        return results

    def _save(self):
        """Persist index and metadata to disk."""
        faiss = _get_faiss()
        os.makedirs(self.index_path, exist_ok=True)

        if self.index is not None:
            faiss.write_index(self.index, self._index_file)

        with open(self._metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False)

    def clear(self):
        """Clear the entire vector store."""
        self.index = None
        self.documents = []
        if os.path.exists(self._index_file):
            os.remove(self._index_file)
        if os.path.exists(self._metadata_path):
            os.remove(self._metadata_path)

    @property
    def count(self) -> int:
        """Number of documents in the store."""
        return self.index.ntotal if self.index else 0

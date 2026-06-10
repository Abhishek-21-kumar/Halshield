"""
HalShield — RAG (Retrieval-Augmented Generation) service.
Orchestrates document loading, chunking, embedding, and retrieval.
"""
from rag.document_loader import load_document
from rag.chunker import chunk_text
from rag.vector_store import VectorStore
from config import settings


class RAGService:
    """High-level RAG interface for document indexing and evidence retrieval."""

    def __init__(self):
        self.vector_store = VectorStore()

    def index_document(self, file_path: str, source: str = "unknown") -> int:
        """
        Load a document, chunk it, generate embeddings, and store in FAISS.

        Args:
            file_path: Path to the document file.
            source: Human-readable source name.

        Returns:
            Number of chunks indexed.
        """
        # 1. Load document
        text = load_document(file_path)
        if not text.strip():
            return 0

        # 2. Chunk text
        chunks = chunk_text(
            text,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )

        if not chunks:
            return 0

        # 3. Add to vector store (embedding + FAISS indexing happens inside)
        count = self.vector_store.add_documents(chunks, source=source)

        return count

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """
        Retrieve the most relevant document chunks for a given query.

        Args:
            query: The text to search for.
            top_k: Number of results to return.

        Returns:
            List of dicts with 'text', 'source', and 'score' keys.
        """
        return self.vector_store.search(query, top_k=top_k)

    def index_text(self, text: str, source: str = "manual_input") -> int:
        """
        Index raw text directly (without loading from file).

        Args:
            text: The text to index.
            source: Source identifier.

        Returns:
            Number of chunks indexed.
        """
        chunks = chunk_text(text)
        if not chunks:
            return 0
        return self.vector_store.add_documents(chunks, source=source)

    @property
    def document_count(self) -> int:
        """Number of indexed document chunks."""
        return self.vector_store.count

    def clear(self):
        """Clear all indexed documents."""
        self.vector_store.clear()

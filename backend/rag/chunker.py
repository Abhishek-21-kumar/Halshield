"""
HalShield — Text chunker.
Splits documents into overlapping chunks for embedding and retrieval.
"""
from __future__ import annotations
from config import settings


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """
    Split text into overlapping chunks using a recursive character-based strategy.

    Args:
        text: The full document text.
        chunk_size: Maximum characters per chunk (default from settings).
        chunk_overlap: Number of overlapping characters between chunks.

    Returns:
        List of text chunks.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    # Split on paragraph boundaries first, then sentences
    separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "]

    _recursive_split(text, separators, chunk_size, chunk_overlap, chunks)

    return chunks


def _recursive_split(
    text: str,
    separators: list[str],
    chunk_size: int,
    chunk_overlap: int,
    result: list[str],
):
    """Recursively split text using a hierarchy of separators."""
    if len(text) <= chunk_size:
        if text.strip():
            result.append(text.strip())
        return

    # Find the best separator that produces reasonable splits
    best_sep = separators[0] if separators else " "
    for sep in separators:
        if sep in text:
            best_sep = sep
            break

    parts = text.split(best_sep)

    current_chunk = ""
    for part in parts:
        candidate = current_chunk + best_sep + part if current_chunk else part

        if len(candidate) <= chunk_size:
            current_chunk = candidate
        else:
            if current_chunk.strip():
                result.append(current_chunk.strip())
            # Start new chunk with overlap from previous chunk
            if chunk_overlap > 0 and current_chunk:
                overlap_text = current_chunk[-chunk_overlap:]
                current_chunk = overlap_text + best_sep + part
            else:
                current_chunk = part

    # Don't forget the last chunk
    if current_chunk.strip():
        result.append(current_chunk.strip())

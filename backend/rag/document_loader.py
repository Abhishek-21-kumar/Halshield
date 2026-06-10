"""
HalShield — Document loader.
Parses PDF, TXT, and DOCX files into raw text.
"""
import os


def load_document(file_path: str) -> str:
    """
    Load a document and return its text content.
    Supports PDF, TXT, and DOCX formats.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _load_pdf(file_path)
    elif ext == ".txt":
        return _load_txt(file_path)
    elif ext == ".docx":
        return _load_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def _load_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n\n".join(text_parts)
    except ImportError:
        # Fallback to PyPDF
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        return "\n\n".join(
            page.extract_text() or "" for page in reader.pages
        )


def _load_txt(file_path: str) -> str:
    """Read a plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _load_docx(file_path: str) -> str:
    """Extract text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except ImportError:
        raise ImportError("python-docx is required for DOCX support. Install with: pip install python-docx")

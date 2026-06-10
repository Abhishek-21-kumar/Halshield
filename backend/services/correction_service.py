"""
HalShield — Correction service.
Generates corrected factual answers from evidence when hallucinations are detected.
"""


def generate_correction(
    original_answer: str,
    claims: list[dict],
    evidence_chunks: list[dict],
) -> dict:
    """
    Generate a corrected version of the answer by replacing hallucinated claims
    with evidence-supported alternatives.

    Args:
        original_answer: The original LLM-generated answer.
        claims: List of claim analysis results (from hallucination detection).
        evidence_chunks: Retrieved evidence from the knowledge base.

    Returns:
        Dict with 'original', 'corrected', and 'changes' keys.
    """
    corrected = original_answer
    changes = []

    # Build evidence context for corrections
    evidence_text = " ".join([c.get("text", "") for c in evidence_chunks[:5]])

    for claim in claims:
        if claim.get("label") == "HALLUCINATED" and claim.get("evidence"):
            original_text = claim["text"]
            # Use the best matching evidence as the correction
            best_evidence = claim["evidence"][0] if claim["evidence"] else {}
            correction_text = best_evidence.get("text", "")

            if correction_text:
                changes.append({
                    "original": original_text,
                    "correction": f"[Based on evidence: {correction_text[:200]}]",
                    "reason": claim.get("explanation", "Contradicts retrieved evidence"),
                })

    # Build corrected answer
    if changes:
        correction_notes = []
        for i, change in enumerate(changes, 1):
            correction_notes.append(
                f"({i}) Original: \"{change['original'][:100]}\" → "
                f"Evidence suggests: \"{change['correction'][:150]}\""
            )

        corrected = original_answer + "\n\n--- Corrections ---\n" + "\n".join(correction_notes)

    return {
        "original": original_answer,
        "corrected": corrected if changes else original_answer,
        "changes": changes,
    }

"""
HalShield — NLI (Natural Language Inference) service.
Uses DeBERTa-v3 cross-encoder to classify claim–evidence pairs
as entailment, neutral, or contradiction.
"""
from config import settings

# Lazy-loaded model
_nli_model = None


def get_nli_model():
    """Load the NLI cross-encoder model (singleton)."""
    global _nli_model
    if _nli_model is None:
        from sentence_transformers import CrossEncoder
        _nli_model = CrossEncoder(settings.NLI_MODEL)
    return _nli_model


def classify_nli(premise: str, hypothesis: str) -> dict:
    """
    Classify the NLI relationship between premise (evidence) and hypothesis (claim).

    Args:
        premise: The evidence/reference text.
        hypothesis: The claim to verify.

    Returns:
        Dict with scores for entailment, neutral, contradiction and the predicted label.
    """
    model = get_nli_model()
    scores = model.predict([(premise, hypothesis)])[0]

    # DeBERTa cross-encoder returns [contradiction, entailment, neutral]
    # or [entailment, neutral, contradiction] depending on model
    # For cross-encoder/nli-deberta-v3-base: labels = ['contradiction', 'entailment', 'neutral']
    labels = ["contradiction", "entailment", "neutral"]

    if len(scores.shape) == 0:
        # Single score model — interpret as entailment probability
        return {
            "entailment": float(scores),
            "neutral": 0.0,
            "contradiction": 1.0 - float(scores),
            "label": "entailment" if float(scores) > 0.5 else "contradiction",
        }

    score_dict = {label: float(score) for label, score in zip(labels, scores)}
    predicted_label = labels[scores.argmax()]

    return {
        **score_dict,
        "label": predicted_label,
    }


def compute_hallucination_score(nli_result: dict) -> float:
    """
    Convert NLI scores into a hallucination probability (0 = factual, 1 = hallucinated).

    Logic:
        - High contradiction → high hallucination score
        - High entailment → low hallucination score
        - Neutral → medium score
    """
    contradiction = nli_result.get("contradiction", 0.0)
    entailment = nli_result.get("entailment", 0.0)
    neutral = nli_result.get("neutral", 0.0)

    # Weighted formula: contradiction pushes score up, entailment pushes down
    score = (contradiction * 1.0) + (neutral * 0.5) - (entailment * 0.3)
    return max(0.0, min(1.0, score))


def classify_claim(score: float) -> tuple[str, str]:
    """
    Classify a hallucination score into a label and color.

    Returns:
        (label, color) tuple.
    """
    if score >= settings.HALLUCINATION_THRESHOLD:
        return "HALLUCINATED", "red"
    elif score >= settings.MEDIUM_THRESHOLD:
        return "UNCERTAIN", "yellow"
    else:
        return "SUPPORTED", "green"

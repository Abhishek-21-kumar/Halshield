"""
HalShield — Core hallucination detection service.
Orchestrates the full pipeline: claim extraction → evidence retrieval →
NLI scoring → classification → explanation → correction.
"""
from utils.text_processing import split_into_sentences, clean_text
from services.nli_service import classify_nli, compute_hallucination_score, classify_claim
from services.correction_service import generate_correction
from config import settings


class HallucinationDetector:
    """
    Main detection engine that combines NLI and RAG
    to identify hallucinations in LLM-generated text.
    """

    def __init__(self):
        # Pre-warm NLI model on first use (lazy loaded inside nli_service)
        pass

    def detect(
        self,
        question: str,
        answer: str,
        context: str = "",
        model_name: str = "GPT",
    ) -> dict:
        """
        Run the full hallucination detection pipeline.

        Args:
            question: The user's original question/prompt.
            answer: The LLM-generated answer to verify.
            context: Reference context (from RAG retrieval or user input).
            model_name: Which LLM model generated the answer.

        Returns:
            Complete analysis result dict.
        """
        # 1. Extract individual claims from the answer
        claims_text = split_into_sentences(clean_text(answer))
        if not claims_text:
            claims_text = [answer]

        # 2. Use the question + context as the evidence basis
        evidence_text = context if context else question

        # 3. Analyze each claim
        claims = []
        for i, claim_text in enumerate(claims_text):
            claim_result = self._analyze_claim(
                claim=claim_text,
                evidence=evidence_text,
                index=i,
            )
            claims.append(claim_result)

        # 4. Compute overall score
        if claims:
            overall_score = sum(c["hallucination_score"] for c in claims) / len(claims)
        else:
            overall_score = 0.0

        # 5. Determine risk level
        if overall_score >= settings.HALLUCINATION_THRESHOLD:
            risk_level = "high"
        elif overall_score >= settings.MEDIUM_THRESHOLD:
            risk_level = "medium"
        else:
            risk_level = "low"

        # 6. Count categories
        num_hallucinated = sum(1 for c in claims if c["label"] == "HALLUCINATED")
        num_supported = sum(1 for c in claims if c["label"] == "SUPPORTED")
        num_uncertain = sum(1 for c in claims if c["label"] == "UNCERTAIN")

        # 7. Generate corrected answer if hallucinations found
        corrected_answer = None
        if num_hallucinated > 0:
            evidence_chunks = [{"text": evidence_text}] if evidence_text else []
            corrected_answer = generate_correction(answer, claims, evidence_chunks)

        return {
            "overall_score": round(overall_score, 4),
            "risk_level": risk_level,
            "claims": claims,
            "corrected_answer": corrected_answer,
            "model_used": model_name,
            "detection_mode": "NLI + RAG",
            "num_claims": len(claims),
            "num_hallucinated": num_hallucinated,
            "num_supported": num_supported,
            "num_uncertain": num_uncertain,
        }

    def _analyze_claim(self, claim: str, evidence: str, index: int) -> dict:
        """
        Analyze a single claim against the evidence.

        Returns:
            Dict with claim analysis results.
        """
        # Run NLI classification
        nli_result = classify_nli(premise=evidence, hypothesis=claim)
        hallucination_score = compute_hallucination_score(nli_result)
        label, color = classify_claim(hallucination_score)

        # Generate explanation
        explanation = self._generate_explanation(
            claim=claim,
            label=label,
            nli_result=nli_result,
            evidence=evidence,
        )

        # Build evidence list for this claim
        claim_evidence = []
        if evidence:
            claim_evidence.append({
                "text": evidence[:300],
                "source": "Reference Context / RAG Retrieval",
                "relevance_score": nli_result.get("entailment", 0.0),
            })

        return {
            "index": index,
            "text": claim,
            "label": label,
            "hallucination_score": round(hallucination_score, 4),
            "color": color,
            "evidence": claim_evidence,
            "explanation": explanation,
            "nli_scores": {
                "entailment": round(nli_result.get("entailment", 0), 4),
                "neutral": round(nli_result.get("neutral", 0), 4),
                "contradiction": round(nli_result.get("contradiction", 0), 4),
            },
        }

    def _generate_explanation(
        self, claim: str, label: str, nli_result: dict, evidence: str,
    ) -> str:
        """Generate a human-readable explanation for the classification."""
        contradiction = nli_result.get("contradiction", 0)
        entailment = nli_result.get("entailment", 0)
        neutral = nli_result.get("neutral", 0)

        if label == "HALLUCINATED":
            return (
                f"This claim shows HIGH contradiction ({contradiction:.1%}) with the retrieved evidence. "
                f"The NLI model indicates this statement likely contradicts the reference material. "
                f"Entailment score is low ({entailment:.1%}), suggesting the claim is not supported."
            )
        elif label == "UNCERTAIN":
            return (
                f"This claim has moderate confidence. Neutral score: {neutral:.1%}, "
                f"Entailment: {entailment:.1%}, Contradiction: {contradiction:.1%}. "
                f"The evidence neither strongly supports nor contradicts this claim."
            )
        else:
            return (
                f"This claim is SUPPORTED by the evidence with {entailment:.1%} entailment confidence. "
                f"Contradiction score is low ({contradiction:.1%}), indicating alignment with the reference."
            )

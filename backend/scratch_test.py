import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from services.hallucination_service import HallucinationDetector

try:
    detector = HallucinationDetector()
    print("Testing hallucinated answer...")
    result = detector.detect(
        question="What is the capital of France?",
        answer="The capital of France is Rome.",  # Hallucinated!
        context="The capital of France is Paris. Rome is the capital of Italy.",
        model_name="GPT"
    )
    print("Result:", result)
except Exception as e:
    import traceback
    traceback.print_exc()

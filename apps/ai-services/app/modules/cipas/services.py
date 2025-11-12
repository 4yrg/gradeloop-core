from app.modules.cipas.schemas import SubmissionInput, IntegrityReport


class CIPASService:
    def __init__(self):
        # In the future, this is where we'd get the ML models
        # e.g., self.clone_model = model_cache["unixcoder"]
        print("CIPAS Service Initialized (Mock)")

        async def process_submission(self, payload: SubmissionInput) -> IntegrityReport:
            # Mock implementation of submission processing
            print(f"Processing submission {payload.submission_id} for student {payload.student_id}(Mock)")

            # Return a fixed mock response the matches the IntegrityReport schema
            return IntegrityReport(
                submission_id=payload.submission_id,
                status="processed",
                is_ai=False,
                integrity_score=0.95,
                detected_clones=["sub_001_similar_function"]
            )


# Dependency Helper
def get_cipas_service():
    return CIPASService()

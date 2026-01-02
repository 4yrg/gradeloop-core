from typing import List
from ..models.submission import Submission
from ..storage.database import get_session
from ..features.normalization import normalize_code_ast, tokenize_source
from .tier1_lexical import tier1
from .tier2_syntactic import tier2
from .tier3_semantic import tier3
from .tier4_verification import tier4

class PipelineOrchestrator:
    def __init__(self):
        pass

    async def processed_submission(self, submission: Submission) -> dict:
        """
        Runs the full detection cascade.
        """
        # 0. Preprocessing
        # Norm for Tier 1
        normalized_code = normalize_code_ast(submission.code)
        tokens = tokenize_source(normalized_code)
        
        # 1. Tier 1: Lexical Search
        candidates = await tier1.search(tokens)
        
        # 2. Tier 2: Syntactic Refinement
        # Pass the original code for AST extraction
        candidates = await tier2.process(submission.id, submission.code, candidates)
        
        # 3. Tier 3: Semantic Refinement (and Embedding Indexing)
        candidates = await tier3.search(submission.id, submission.code, candidates)
        
        # 4. Tier 4: Verification
        final_matches = tier4.verify(candidates)
        
        # 5. Indexing (Tier 1 is indexed manually here to ensure we only index after searching)
        await tier1.index_submission(submission, tokens)
        
        # 6. Save Submission to DB (Done in API usually, but ensure consistency)
        
        return {
            "submission_id": submission.id,
            "matches": final_matches
        }

orchestrator = PipelineOrchestrator()

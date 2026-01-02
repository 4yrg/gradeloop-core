from typing import List

class Tier4Verification:
    def verify(self, candidates: List[dict]) -> List[dict]:
        """
        Final pass to assign strict clone types and filter low confidence matches.
        """
        final_results = []
        
        for cand in candidates:
            score = cand["similarity"]
            
            # Determine Clone Type if not already set or refine it
            # Logic:
            # Type-1: Exact Hash (captured in Tier 1)
            # Type-2: High lexical overlap > 0.9
            # Type-3: Syntactic > 0.7
            # Type-4: Semantic > 0.75 but low lexical
            
            clone_type = cand.get("type", "Type-4")
            
            if score >= 0.95: 
                clone_type = "Type-1/2" # Very strong match
            elif score >= 0.8:
                clone_type = "Type-3"
            elif score >= 0.7:
                clone_type = "Type-4"
            else:
                continue # Drop low confidence
                
            cand["clone_type"] = clone_type
            cand["final_score"] = round(score, 3)
            final_results.append(cand)
            
        return final_results

tier4 = Tier4Verification()

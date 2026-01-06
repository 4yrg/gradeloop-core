"""
Adaptive Assessment Engine for IVAS
Implements BKT (Bayesian Knowledge Tracing) and IRT (Item Response Theory) algorithms
for intelligent adaptive questioning and competency assessment.
"""

import math
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class UnderstandingLevel(Enum):
    """Student understanding levels"""
    NONE = "none"
    MINIMAL = "minimal"
    PARTIAL = "partial"
    GOOD = "good"
    EXCELLENT = "excellent"


class CompetencyLevel(Enum):
    """Final competency levels"""
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


@dataclass
class Concept:
    """Represents a concept/skill being assessed"""
    name: str
    difficulty: float = 0.5  # 0.0 (easy) to 1.0 (hard)
    weight: float = 1.0  # Importance weight


@dataclass
class QuestionItem:
    """Represents a question with IRT parameters"""
    question_id: str
    question_text: str
    concept: str
    # IRT Parameters
    difficulty: float = 0.0  # b parameter: -3 to +3 (easier to harder)
    discrimination: float = 1.0  # a parameter: how well it differentiates ability levels
    guessing: float = 0.0  # c parameter: probability of correct guess (0 for open-ended)


@dataclass
class StudentResponse:
    """Represents a student's response to a question"""
    question_id: str
    response_text: str
    is_correct: bool
    understanding_level: UnderstandingLevel
    confidence_score: float  # 0.0 to 1.0
    response_time_seconds: float = 0.0


@dataclass
class BKTParams:
    """Bayesian Knowledge Tracing parameters for a skill/concept"""
    # Prior probability that student knows the skill
    p_know: float = 0.3
    # Probability of learning the skill after practice
    p_learn: float = 0.1
    # Probability of guessing correctly when not knowing
    p_guess: float = 0.2
    # Probability of slipping (wrong answer when knowing)
    p_slip: float = 0.1


class BayesianKnowledgeTracer:
    """
    Bayesian Knowledge Tracing (BKT) implementation.
    
    Tracks the probability that a student has mastered each concept
    based on their response history.
    """
    
    def __init__(self):
        # Default BKT parameters per concept
        self.concept_params: Dict[str, BKTParams] = {}
        # Current knowledge state per concept (P(Know))
        self.knowledge_state: Dict[str, float] = {}
        # History of observations
        self.observation_history: List[Dict] = []
    
    def initialize_concept(self, concept: str, params: BKTParams = None):
        """Initialize tracking for a concept"""
        if params is None:
            params = BKTParams()
        self.concept_params[concept] = params
        self.knowledge_state[concept] = params.p_know
        logger.debug(f"BKT: Initialized concept '{concept}' with P(Know)={params.p_know}")
    
    def update(self, concept: str, is_correct: bool, confidence: float = 1.0) -> float:
        """
        Update knowledge state based on observation.
        
        Args:
            concept: The concept/skill being assessed
            is_correct: Whether the response was correct
            confidence: Confidence in the correctness judgment (0-1)
        
        Returns:
            Updated P(Know) for the concept
        """
        if concept not in self.concept_params:
            self.initialize_concept(concept)
        
        params = self.concept_params[concept]
        p_know = self.knowledge_state[concept]
        
        # Calculate posterior P(Know | observation) using Bayes' theorem
        if is_correct:
            # P(Know | Correct) = P(Correct | Know) * P(Know) / P(Correct)
            # P(Correct | Know) = 1 - p_slip
            # P(Correct | ~Know) = p_guess
            # P(Correct) = P(Correct | Know) * P(Know) + P(Correct | ~Know) * P(~Know)
            
            p_correct_given_know = 1 - params.p_slip
            p_correct_given_not_know = params.p_guess
            p_correct = p_correct_given_know * p_know + p_correct_given_not_know * (1 - p_know)
            
            if p_correct > 0:
                p_know_given_correct = (p_correct_given_know * p_know) / p_correct
            else:
                p_know_given_correct = p_know
            
            posterior = p_know_given_correct
        else:
            # P(Know | Wrong) = P(Wrong | Know) * P(Know) / P(Wrong)
            # P(Wrong | Know) = p_slip
            # P(Wrong | ~Know) = 1 - p_guess
            
            p_wrong_given_know = params.p_slip
            p_wrong_given_not_know = 1 - params.p_guess
            p_wrong = p_wrong_given_know * p_know + p_wrong_given_not_know * (1 - p_know)
            
            if p_wrong > 0:
                p_know_given_wrong = (p_wrong_given_know * p_know) / p_wrong
            else:
                p_know_given_wrong = p_know
            
            posterior = p_know_given_wrong
        
        # Apply learning effect - student might learn from the interaction
        # P(Know after) = P(Know before) + P(Learn) * P(~Know before)
        p_learn_effect = params.p_learn * (1 - posterior)
        new_p_know = posterior + p_learn_effect
        
        # Apply confidence weighting (uncertain observations have less effect)
        weighted_p_know = p_know + confidence * (new_p_know - p_know)
        
        # Clamp to valid probability range
        weighted_p_know = max(0.01, min(0.99, weighted_p_know))
        
        self.knowledge_state[concept] = weighted_p_know
        
        # Record observation
        self.observation_history.append({
            "concept": concept,
            "is_correct": is_correct,
            "confidence": confidence,
            "prior": p_know,
            "posterior": weighted_p_know,
        })
        
        logger.info(f"BKT Update: {concept} - correct={is_correct}, P(Know): {p_know:.3f} -> {weighted_p_know:.3f}")
        
        return weighted_p_know
    
    def get_mastery_probability(self, concept: str) -> float:
        """Get current P(Know) for a concept"""
        return self.knowledge_state.get(concept, 0.3)
    
    def get_all_knowledge_states(self) -> Dict[str, float]:
        """Get knowledge state for all tracked concepts"""
        return self.knowledge_state.copy()
    
    def is_mastered(self, concept: str, threshold: float = 0.85) -> bool:
        """Check if a concept is considered mastered"""
        return self.get_mastery_probability(concept) >= threshold
    
    def get_weakest_concepts(self, n: int = 3) -> List[Tuple[str, float]]:
        """Get the n concepts with lowest mastery probability"""
        sorted_concepts = sorted(
            self.knowledge_state.items(),
            key=lambda x: x[1]
        )
        return sorted_concepts[:n]


class ItemResponseTheory:
    """
    Item Response Theory (IRT) implementation using the 3-Parameter Logistic Model.
    
    Used to estimate student ability and select optimal questions.
    """
    
    def __init__(self):
        # Estimated student ability (theta) - typically -3 to +3
        self.theta: float = 0.0
        # Standard error of ability estimate
        self.se_theta: float = 1.0
        # Response history for ability estimation
        self.responses: List[Dict] = []
    
    def probability_correct(self, theta: float, item: QuestionItem) -> float:
        """
        Calculate probability of correct response using 3PL model.
        
        P(correct | theta) = c + (1-c) / (1 + exp(-a(theta - b)))
        
        where:
            theta = student ability
            a = discrimination parameter
            b = difficulty parameter
            c = guessing parameter
        """
        a = item.discrimination
        b = item.difficulty
        c = item.guessing
        
        exponent = -a * (theta - b)
        # Prevent overflow
        exponent = max(-10, min(10, exponent))
        
        p = c + (1 - c) / (1 + math.exp(exponent))
        return p
    
    def information(self, theta: float, item: QuestionItem) -> float:
        """
        Calculate Fisher information for an item at given ability level.
        
        Higher information = item is more useful for estimating ability at this level.
        """
        a = item.discrimination
        b = item.difficulty
        c = item.guessing
        
        p = self.probability_correct(theta, item)
        q = 1 - p
        
        # Information function for 3PL
        if p > c and q > 0:
            info = (a ** 2) * ((p - c) ** 2 / ((1 - c) ** 2)) * (q / p)
        else:
            info = 0.0
        
        return info
    
    def update_ability(self, item: QuestionItem, is_correct: bool, score: float = None) -> float:
        """
        Update ability estimate using Newton-Raphson method.
        
        For partial credit, score should be between 0 and 1.
        For binary scoring, score is 1.0 (correct) or 0.0 (incorrect).
        """
        if score is None:
            score = 1.0 if is_correct else 0.0
        
        # Record response
        self.responses.append({
            "item": item,
            "is_correct": is_correct,
            "score": score,
        })
        
        # Newton-Raphson update
        # We're maximizing the log-likelihood
        learning_rate = 0.5
        
        p = self.probability_correct(self.theta, item)
        q = 1 - p
        
        # Prevent division issues
        p = max(0.001, min(0.999, p))
        q = max(0.001, min(0.999, q))
        
        # Gradient of log-likelihood
        # For partial credit, we use a weighted average
        gradient = item.discrimination * (score - p)
        
        # Hessian approximation (second derivative)
        hessian = -self.information(self.theta, item)
        
        if abs(hessian) > 0.001:
            delta = -gradient / hessian
        else:
            delta = learning_rate * gradient
        
        # Update with damping to prevent wild swings
        delta = max(-1.0, min(1.0, delta))
        self.theta += learning_rate * delta
        
        # Keep theta in reasonable range
        self.theta = max(-3.5, min(3.5, self.theta))
        
        # Update standard error
        total_info = sum(
            self.information(self.theta, r["item"]) 
            for r in self.responses
        )
        if total_info > 0:
            self.se_theta = 1.0 / math.sqrt(total_info)
        
        logger.info(f"IRT Update: ability theta={self.theta:.3f}, SE={self.se_theta:.3f}")
        
        return self.theta
    
    def select_optimal_question(self, available_items: List[QuestionItem]) -> QuestionItem:
        """
        Select the question with maximum information at current ability level.
        
        This implements adaptive testing - selecting questions that are
        neither too easy nor too hard for the student.
        """
        if not available_items:
            raise ValueError("No available items to select from")
        
        # Calculate information for each item
        item_info = [
            (item, self.information(self.theta, item))
            for item in available_items
        ]
        
        # Select item with maximum information
        best_item = max(item_info, key=lambda x: x[1])
        
        logger.info(f"IRT: Selected question '{best_item[0].question_id}' with info={best_item[1]:.3f}")
        
        return best_item[0]
    
    def get_ability_level(self) -> str:
        """Convert theta to human-readable ability level"""
        if self.theta < -1.5:
            return "BEGINNER"
        elif self.theta < 0.0:
            return "INTERMEDIATE"
        elif self.theta < 1.5:
            return "ADVANCED"
        else:
            return "EXPERT"
    
    def get_ability_percentile(self) -> int:
        """Estimate percentile rank (assuming normal distribution of abilities)"""
        # CDF of standard normal at theta
        from math import erf
        percentile = 0.5 * (1 + erf(self.theta / math.sqrt(2)))
        return int(percentile * 100)


class AdaptiveAssessmentEngine:
    """
    Main Adaptive Assessment Engine combining BKT and IRT.
    
    Uses BKT to track knowledge of specific concepts/skills.
    Uses IRT to estimate overall ability and select optimal questions.
    """
    
    def __init__(self, concepts: List[str] = None):
        self.bkt = BayesianKnowledgeTracer()
        self.irt = ItemResponseTheory()
        
        # Session tracking
        self.session_started = False
        self.question_count = 0
        self.max_questions = 7
        self.session_duration = 0
        self.max_duration = 600  # 10 minutes
        
        # Response history
        self.response_history: List[StudentResponse] = []
        
        # Initialize concepts if provided
        if concepts:
            for concept in concepts:
                self.bkt.initialize_concept(concept)
        
        # Difficulty score for adaptive questioning (-5 to +5)
        self.difficulty_score = 0
        
        logger.info("AdaptiveAssessmentEngine initialized")
    
    def start_session(self, concepts: List[Concept] = None):
        """Start a new assessment session"""
        self.session_started = True
        self.question_count = 0
        self.response_history = []
        self.difficulty_score = 0
        
        if concepts:
            for concept in concepts:
                # Adjust BKT params based on concept difficulty
                params = BKTParams(
                    p_know=0.3 * (1 - concept.difficulty),  # Harder concepts = lower prior
                    p_learn=0.15,
                    p_guess=0.1 + 0.1 * (1 - concept.difficulty),  # Easier = more guessable
                    p_slip=0.1,
                )
                self.bkt.initialize_concept(concept.name, params)
        
        logger.info("Assessment session started")
    
    def process_response(
        self,
        question: str,
        response: str,
        concept: str,
        assessment: Dict[str, Any],
        response_time: float = 0.0
    ) -> Dict[str, Any]:
        """
        Process a student response and update all models.
        
        Args:
            question: The question that was asked
            response: Student's text response
            concept: The concept being assessed
            assessment: LLM assessment result with understanding_level, confidence_score, etc.
            response_time: Time taken to respond in seconds
        
        Returns:
            Dict with updated state and next question recommendations
        """
        # Map understanding level to correctness
        understanding = assessment.get("understanding_level", "partial")
        confidence = assessment.get("confidence_score", 0.5)
        
        is_correct = understanding in ["good", "excellent"]
        is_partial = understanding == "partial"
        
        # For IRT, convert to score (0-1)
        score_map = {
            "none": 0.0,
            "minimal": 0.2,
            "partial": 0.5,
            "good": 0.8,
            "excellent": 1.0,
        }
        score = score_map.get(understanding, 0.5)
        
        # Create response record
        student_response = StudentResponse(
            question_id=f"q_{self.question_count}",
            response_text=response,
            is_correct=is_correct,
            understanding_level=UnderstandingLevel(understanding),
            confidence_score=confidence,
            response_time_seconds=response_time,
        )
        self.response_history.append(student_response)
        self.question_count += 1
        
        # Update BKT
        p_know = self.bkt.update(concept, is_correct, confidence)
        
        # Update IRT
        item = QuestionItem(
            question_id=f"q_{self.question_count}",
            question_text=question,
            concept=concept,
            difficulty=self._estimate_question_difficulty(concept),
            discrimination=1.0 if confidence > 0.7 else 0.7,
            guessing=0.1,
        )
        theta = self.irt.update_ability(item, is_correct, score)
        
        # Adjust difficulty score for next question
        if is_correct:
            self.difficulty_score = min(5, self.difficulty_score + 1)
        elif is_partial:
            pass  # Keep same difficulty
        else:
            self.difficulty_score = max(-5, self.difficulty_score - 1)
        
        # Determine next difficulty
        next_difficulty = self._get_next_difficulty()
        
        # Find concepts that need more work
        weak_concepts = self.bkt.get_weakest_concepts(2)
        
        result = {
            "question_number": self.question_count,
            "understanding_level": understanding,
            "is_correct": is_correct,
            "score": score,
            # BKT results
            "concept_mastery": p_know,
            "all_concept_mastery": self.bkt.get_all_knowledge_states(),
            # IRT results
            "ability_theta": theta,
            "ability_level": self.irt.get_ability_level(),
            "ability_percentile": self.irt.get_ability_percentile(),
            # Next question guidance
            "next_difficulty": next_difficulty,
            "weak_concepts": [c[0] for c in weak_concepts],
            "suggested_focus": weak_concepts[0][0] if weak_concepts else concept,
            # Session status
            "should_continue": not self.should_end_session(),
            "questions_remaining": max(0, self.max_questions - self.question_count),
        }
        
        logger.info(f"Response processed: Q{self.question_count}, mastery={p_know:.2f}, ability={theta:.2f}")
        
        return result
    
    def _estimate_question_difficulty(self, concept: str) -> float:
        """Estimate question difficulty based on concept and session state"""
        # Base difficulty from the difficulty score
        base = self.difficulty_score / 5.0  # Normalize to -1 to +1
        
        # Adjust based on concept mastery (ask harder if they're doing well)
        mastery = self.bkt.get_mastery_probability(concept)
        mastery_adjustment = (mastery - 0.5) * 2  # -1 to +1
        
        difficulty = base + 0.3 * mastery_adjustment
        
        return max(-2.0, min(2.0, difficulty))  # Clamp to reasonable range
    
    def _get_next_difficulty(self) -> str:
        """Determine difficulty level for next question"""
        if self.difficulty_score >= 3:
            return "harder"
        elif self.difficulty_score <= -2:
            return "easier"
        else:
            return "same"
    
    def should_end_session(self) -> bool:
        """Check if session should end"""
        if self.question_count >= self.max_questions:
            logger.info("Session ending: max questions reached")
            return True
        
        if self.session_duration >= self.max_duration:
            logger.info("Session ending: max duration reached")
            return True
        
        # End early if student has demonstrated mastery of all concepts
        all_mastered = all(
            self.bkt.is_mastered(c, threshold=0.90)
            for c in self.bkt.knowledge_state.keys()
        )
        if all_mastered and self.question_count >= 3:
            logger.info("Session ending: all concepts mastered")
            return True
        
        return False
    
    def generate_final_assessment(self) -> Dict[str, Any]:
        """Generate comprehensive final assessment from session data"""
        
        # Calculate overall score from multiple sources
        # 1. Average response score
        avg_score = 0.0
        if self.response_history:
            scores = [
                {"none": 0, "minimal": 20, "partial": 50, "good": 80, "excellent": 100}
                .get(r.understanding_level.value, 50)
                for r in self.response_history
            ]
            avg_score = sum(scores) / len(scores)
        
        # 2. Concept mastery average
        mastery_scores = list(self.bkt.knowledge_state.values())
        avg_mastery = sum(mastery_scores) / len(mastery_scores) if mastery_scores else 0.5
        
        # 3. IRT ability estimate (convert to 0-100 scale)
        ability_score = (self.irt.theta + 3) / 6 * 100  # -3 to +3 -> 0 to 100
        ability_score = max(0, min(100, ability_score))
        
        # Combine scores (weighted average)
        overall_score = int(
            0.35 * avg_score + 
            0.35 * (avg_mastery * 100) + 
            0.30 * ability_score
        )
        overall_score = max(0, min(100, overall_score))
        
        # Determine competency level
        if overall_score >= 85:
            competency = CompetencyLevel.EXPERT
        elif overall_score >= 70:
            competency = CompetencyLevel.ADVANCED
        elif overall_score >= 50:
            competency = CompetencyLevel.INTERMEDIATE
        else:
            competency = CompetencyLevel.BEGINNER
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        for concept, mastery in self.bkt.knowledge_state.items():
            if mastery >= 0.7:
                strengths.append(f"Good understanding of {concept}")
            elif mastery < 0.4:
                weaknesses.append(f"Needs improvement in {concept}")
        
        # Count correct/incorrect responses
        correct_count = sum(1 for r in self.response_history if r.is_correct)
        total_count = len(self.response_history)
        
        assessment = {
            "overall_score": overall_score,
            "competency_level": competency.value,
            # Detailed scores
            "response_score": round(avg_score, 1),
            "mastery_score": round(avg_mastery * 100, 1),
            "ability_score": round(ability_score, 1),
            "ability_theta": round(self.irt.theta, 2),
            "ability_percentile": self.irt.get_ability_percentile(),
            # Performance summary
            "questions_answered": total_count,
            "correct_responses": correct_count,
            "accuracy_rate": round(correct_count / total_count * 100, 1) if total_count > 0 else 0,
            # Concept mastery
            "concept_mastery": {
                concept: round(mastery * 100, 1)
                for concept, mastery in self.bkt.knowledge_state.items()
            },
            # Strengths and weaknesses
            "strengths": strengths if strengths else ["Participated actively in the session"],
            "weaknesses": weaknesses if weaknesses else ["Continue practicing to strengthen understanding"],
            # Recommendations
            "recommendations": self._generate_recommendations(),
        }
        
        logger.info(f"Final assessment: score={overall_score}, level={competency.value}")
        
        return assessment
    
    def _generate_recommendations(self) -> List[str]:
        """Generate learning recommendations based on assessment"""
        recommendations = []
        
        # Based on weakest concepts
        weak = self.bkt.get_weakest_concepts(2)
        for concept, mastery in weak:
            if mastery < 0.5:
                recommendations.append(f"Review and practice: {concept}")
        
        # Based on ability level
        level = self.irt.get_ability_level()
        if level == "BEGINNER":
            recommendations.append("Focus on foundational concepts before advancing")
        elif level == "INTERMEDIATE":
            recommendations.append("Practice applying concepts to new problems")
        elif level == "ADVANCED":
            recommendations.append("Challenge yourself with complex scenarios")
        
        # Based on response patterns
        if self.response_history:
            low_confidence = [r for r in self.response_history if r.confidence_score < 0.5]
            if len(low_confidence) > len(self.response_history) // 2:
                recommendations.append("Work on explaining concepts more clearly and completely")
        
        return recommendations[:4]  # Limit to 4 recommendations


# Singleton instance
assessment_engine = AdaptiveAssessmentEngine()

"""
IVAS Services - AI service implementations
Contains ASR, TTS, and LLM service classes
"""

from typing import Optional, List, Dict, Any
import logging
import tempfile
import os

from config import settings

logger = logging.getLogger(__name__)

# Lazy import for whisper to avoid startup delay
_whisper_model = None


class ASRService:
    """
    Automatic Speech Recognition Service using OpenAI Whisper.
    Provides accurate transcription of audio to text.
    """
    
    def __init__(self, model_size: str = None):
        """
        Initialize ASR service.
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
        """
        self.model_size = model_size or settings.WHISPER_MODEL_SIZE
        self.model = None
        self._initialized = False
        logger.info(f"ASR Service created with model size: {self.model_size}")
    
    def initialize(self):
        """
        Initialize the Whisper model.
        Called lazily on first transcription request.
        """
        global _whisper_model
        
        if self._initialized and self.model is not None:
            return
        
        # Reuse global model if same size
        if _whisper_model is not None:
            self.model = _whisper_model
            self._initialized = True
            logger.info("ASR Service reusing existing model")
            return
        
        try:
            import whisper
            
            logger.info(f"Loading Whisper model: {self.model_size}...")
            self.model = whisper.load_model(self.model_size)
            _whisper_model = self.model
            self._initialized = True
            logger.info(f"Whisper model loaded successfully: {self.model_size}")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper model: {e}")
            raise RuntimeError(f"ASR initialization failed: {e}")
    
    def transcribe(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio to text.
        
        Args:
            audio_bytes: Raw audio data (WAV, MP3, etc.)
            language: Expected language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            Dict with transcript, confidence, duration, and language
        """
        self.initialize()
        
        if len(audio_bytes) == 0:
            return {
                "transcript": "",
                "confidence": 0.0,
                "duration": 0.0,
                "language": language,
            }
        
        # Save audio to temp file (whisper requires file path)
        # Use .webm extension since frontend sends WebM/Opus encoded audio
        temp_file = None
        wav_file = None
        try:
            # First save as webm (the actual format from browser)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
            temp_file.write(audio_bytes)
            temp_file.close()
            
            # Convert to wav using ffmpeg for better compatibility
            wav_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            wav_file.close()
            
            import subprocess
            try:
                result = subprocess.run([
                    'ffmpeg', '-y', '-i', temp_file.name,
                    '-ar', '16000',  # 16kHz sample rate for speech recognition
                    '-ac', '1',      # Mono audio
                    '-f', 'wav',
                    wav_file.name
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    logger.warning(f"FFmpeg conversion warning: {result.stderr[:500]}")
                    # Try using original file if conversion fails
                    audio_file_path = temp_file.name
                else:
                    audio_file_path = wav_file.name
            except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                logger.warning(f"FFmpeg not available or timed out: {e}, using original file")
                audio_file_path = temp_file.name
            
            logger.info(f"Transcribing {len(audio_bytes)} bytes of audio...")
            
            # Perform transcription using openai-whisper
            result = self.model.transcribe(
                audio_file_path,
                language=language,
                fp16=False,  # Use FP32 for CPU compatibility
            )
            
            transcript = result.get("text", "").strip()
            detected_language = result.get("language", language)
            
            # Calculate duration from segments if available
            segments = result.get("segments", [])
            duration = 0.0
            total_confidence = 0.0
            
            if segments:
                duration = segments[-1].get("end", 0.0) if segments else 0.0
                # Average no_speech_prob as inverse confidence
                for seg in segments:
                    total_confidence += (1.0 - seg.get("no_speech_prob", 0.5))
                avg_confidence = total_confidence / len(segments)
            else:
                avg_confidence = 0.5
            
            logger.info(f"Transcription complete: {len(transcript)} chars, {duration:.1f}s")
            
            return {
                "transcript": transcript,
                "confidence": round(avg_confidence, 3),
                "duration": round(duration, 2),
                "language": detected_language,
            }
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"Transcription failed: {e}")
        finally:
            # Clean up temp files
            if temp_file and os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
            if wav_file and os.path.exists(wav_file.name):
                os.unlink(wav_file.name)
    
    @property
    def is_available(self) -> bool:
        """Check if ASR service is available"""
        try:
            import whisper
            return True
        except ImportError:
            return False


# Lazy import for TTS
_tts_initialized = False


class TTSService:
    """
    Text-to-Speech Service using Edge TTS (Microsoft Azure Neural Voices).
    Provides high-quality, natural-sounding speech synthesis.
    """
    
    # Voice mappings for different emotions/styles
    VOICE_STYLES = {
        "neutral": "en-US-AriaNeural",
        "friendly": "en-US-JennyNeural",
        "professional": "en-US-GuyNeural",
        "empathetic": "en-US-SaraNeural",
        "calm": "en-GB-SoniaNeural",
    }
    
    def __init__(self, model_name: str = None):
        """
        Initialize TTS service.
        
        Args:
            model_name: Voice model to use (default: en-US-AriaNeural)
        """
        self.model_name = model_name or settings.TTS_MODEL
        self._initialized = False
        logger.info(f"TTS Service created with voice: {self.model_name}")
    
    def initialize(self):
        """
        Initialize the TTS service.
        Called lazily on first synthesis request.
        """
        global _tts_initialized
        
        if self._initialized:
            return
        
        try:
            import edge_tts
            self._initialized = True
            _tts_initialized = True
            logger.info("TTS Service initialized successfully")
        except ImportError as e:
            logger.error(f"Failed to import edge_tts: {e}")
            raise RuntimeError("TTS initialization failed: edge-tts not installed")
    
    async def synthesize_async(
        self, 
        text: str, 
        emotion: str = "neutral",
        speed: float = 1.0,
        language: str = "en"
    ) -> bytes:
        """
        Synthesize speech from text asynchronously.
        
        Args:
            text: Text to synthesize
            emotion: Emotion/style of speech (neutral, friendly, professional, empathetic, calm)
            speed: Speech speed multiplier (0.5 to 2.0)
            language: Language code (used for voice selection)
        
        Returns:
            WAV audio bytes
        """
        self.initialize()
        
        import edge_tts
        import io
        
        # Select voice based on emotion
        voice = self.VOICE_STYLES.get(emotion, self.VOICE_STYLES["neutral"])
        
        # Adjust rate based on speed
        rate = f"{int((speed - 1) * 100):+d}%"
        
        logger.info(f"TTS synthesizing: '{text[:50]}...' with voice={voice}, rate={rate}")
        
        try:
            # Create communicator
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            
            # Collect audio data
            audio_data = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.write(chunk["data"])
            
            audio_bytes = audio_data.getvalue()
            
            # Edge TTS outputs MP3 - return directly (smaller and faster than WAV)
            logger.info(f"TTS synthesis complete: {len(audio_bytes)} bytes (MP3)")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            raise RuntimeError(f"TTS synthesis failed: {e}")
    
    def synthesize(
        self, 
        text: str, 
        emotion: str = "neutral",
        speed: float = 1.0,
        language: str = "en"
    ) -> bytes:
        """
        Synchronous wrapper for synthesize_async.
        
        Args:
            text: Text to synthesize
            emotion: Emotion/style of speech
            speed: Speech speed multiplier
            language: Language code
        
        Returns:
            WAV audio bytes
        """
        import asyncio
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            # If called from async context, create new loop in thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(
                    asyncio.run,
                    self.synthesize_async(text, emotion, speed, language)
                )
                return future.result()
        else:
            return loop.run_until_complete(
                self.synthesize_async(text, emotion, speed, language)
            )
    
    def _mp3_to_wav(self, mp3_bytes: bytes) -> bytes:
        """Convert MP3 audio to WAV format"""
        try:
            from pydub import AudioSegment
            import io
            
            # Load MP3
            audio = AudioSegment.from_mp3(io.BytesIO(mp3_bytes))
            
            # Convert to WAV
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            return wav_buffer.getvalue()
            
        except Exception as e:
            logger.warning(f"MP3 to WAV conversion failed: {e}, returning MP3")
            return mp3_bytes
    
    def _create_empty_wav(self) -> bytes:
        """Create an empty but valid WAV file"""
        return bytes([
            0x52, 0x49, 0x46, 0x46,  # "RIFF"
            0x24, 0x00, 0x00, 0x00,  # File size
            0x57, 0x41, 0x56, 0x45,  # "WAVE"
            0x66, 0x6D, 0x74, 0x20,  # "fmt "
            0x10, 0x00, 0x00, 0x00,  # Chunk size
            0x01, 0x00,              # Audio format (PCM)
            0x01, 0x00,              # Channels (mono)
            0x80, 0x3E, 0x00, 0x00,  # Sample rate (16000)
            0x00, 0x7D, 0x00, 0x00,  # Byte rate
            0x02, 0x00,              # Block align
            0x10, 0x00,              # Bits per sample
            0x64, 0x61, 0x74, 0x61,  # "data"
            0x00, 0x00, 0x00, 0x00,  # Data size
        ])
    
    @property
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        try:
            import edge_tts
            return True
        except ImportError:
            return False


class LLMService:
    """
    Large Language Model Service using Ollama with Llama 3.1.
    Provides Socratic questioning and response assessment for viva.
    """
    
    def __init__(self, model: str = None):
        """
        Initialize LLM service.
        
        Args:
            model: Ollama model name (default: llama3.1:8b)
        """
        self.model = model or settings.OLLAMA_MODEL
        self.client = None
        self._initialized = False
        logger.info(f"LLM Service created with model: {self.model}")
    
    def initialize(self):
        """
        Initialize the Ollama client.
        Called lazily on first request.
        """
        if self._initialized and self.client is not None:
            return
        
        try:
            import ollama
            
            self.client = ollama.Client(host=settings.OLLAMA_HOST)
            # Test connection
            self.client.list()
            self._initialized = True
            logger.info(f"LLM Service initialized with Ollama at {settings.OLLAMA_HOST}")
        except Exception as e:
            logger.error(f"Failed to initialize Ollama client: {e}")
            raise RuntimeError(f"LLM initialization failed: {e}")
    
    def _build_messages(
        self,
        system_prompt: str,
        user_prompt: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> List[Dict[str, str]]:
        """Build message list for Ollama chat API"""
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            for turn in conversation_history:
                messages.append({
                    "role": turn.get("role", "user"),
                    "content": turn.get("content", "")
                })
        
        messages.append({"role": "user", "content": user_prompt})
        return messages
    
    def generate_question(
        self,
        code: Optional[str] = None,
        topic: Optional[str] = None,
        difficulty: str = "medium",
        conversation_history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a Socratic question for viva assessment.
        
        Args:
            code: Student's code submission
            topic: Topic being assessed
            difficulty: Question difficulty level (easy, medium, hard)
            conversation_history: Previous conversation turns
        
        Returns:
            Dict with question and metadata
        """
        self.initialize()
        
        from prompts import SYSTEM_PROMPT, INITIAL_QUESTION_PROMPT, FOLLOW_UP_QUESTION_PROMPT, DIFFICULTY_PROMPTS
        
        # Build the prompt
        if not conversation_history:
            # Initial question
            user_prompt = INITIAL_QUESTION_PROMPT.format(
                code=code or "No code provided",
                topic=topic or "general programming concepts",
                difficulty=difficulty
            )
        else:
            # Follow-up question
            history_text = "\n".join([
                f"{turn.get('role', 'unknown').upper()}: {turn.get('content', '')}"
                for turn in conversation_history[-6:]  # Last 6 turns for context
            ])
            
            # Determine difficulty adjustment based on conversation
            difficulty_adjustment = DIFFICULTY_PROMPTS.get(difficulty, DIFFICULTY_PROMPTS["same"])
            
            user_prompt = FOLLOW_UP_QUESTION_PROMPT.format(
                code=code or "No code provided",
                conversation_history=history_text,
                understanding_level="partial",  # This would come from assessment
                difficulty_adjustment=difficulty_adjustment
            )
        
        try:
            logger.info(f"Generating question for topic: {topic}, difficulty: {difficulty}")
            
            messages = self._build_messages(SYSTEM_PROMPT, user_prompt, None)
            
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 256,
                }
            )
            
            question = response["message"]["content"].strip()
            
            # Clean up the question (remove any extra formatting)
            question = question.strip('"\'')
            if question.startswith("Question:"):
                question = question[9:].strip()
            
            logger.info(f"Generated question: {question[:100]}...")
            
            return {
                "question": question,
                "difficulty": difficulty,
                "topic": topic or "general programming",
                "follow_up_hints": self._generate_hints(topic, difficulty),
            }
            
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            # Return a fallback question
            return {
                "question": "Can you explain your approach to solving this problem?",
                "difficulty": difficulty,
                "topic": topic or "general programming",
                "follow_up_hints": ["Think about the key steps", "Consider edge cases"],
                "error": str(e)
            }
    
    def _generate_hints(self, topic: Optional[str], difficulty: str) -> List[str]:
        """Generate follow-up hints based on topic and difficulty"""
        hints_map = {
            "easy": [
                "Can you walk me through the basic flow?",
                "What does this function/variable do?",
            ],
            "medium": [
                "Consider what happens with edge cases",
                "Think about error handling",
                "How would you test this?",
            ],
            "hard": [
                "How would you optimize this?",
                "What are the time/space complexities?",
                "How would this scale?",
            ],
        }
        return hints_map.get(difficulty, hints_map["medium"])
    
    def assess_response(
        self,
        question: str,
        response: str,
        expected_concepts: List[str] = None,
        code_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Assess a student's response to a question.
        
        Args:
            question: The question that was asked
            response: Student's response
            expected_concepts: Concepts expected in the answer
            code_context: Relevant code for context
        
        Returns:
            Dict with assessment details
        """
        self.initialize()
        
        from prompts import ASSESSMENT_PROMPT
        import json
        
        user_prompt = ASSESSMENT_PROMPT.format(
            question=question,
            response=response,
            code_context=code_context or "No code context provided",
            expected_concepts=", ".join(expected_concepts) if expected_concepts else "General understanding"
        )
        
        try:
            logger.info(f"Assessing response: {response[:50]}...")
            
            messages = [
                {"role": "system", "content": "You are an expert programming instructor assessing student responses. Always respond in valid JSON format."},
                {"role": "user", "content": user_prompt}
            ]
            
            llm_response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.3,  # Lower temperature for more consistent assessment
                    "top_p": 0.9,
                    "num_predict": 512,
                },
                format="json"
            )
            
            result_text = llm_response["message"]["content"].strip()
            
            # Parse JSON response
            try:
                assessment = json.loads(result_text)
            except json.JSONDecodeError:
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', result_text)
                if json_match:
                    assessment = json.loads(json_match.group())
                else:
                    raise ValueError("Could not parse JSON from response")
            
            # Normalize and validate the assessment (NEW V2 format with rubric)
            normalized = {
                # Rubric scores (0-5 each, total 20)
                "rubric_scores": assessment.get("rubric_scores", {
                    "concept_identification": 3,
                    "explanation_quality": 3,
                    "understanding_depth": 2,
                    "real_world_application": 2
                }),
                "total_points": assessment.get("total_points", 10),
                # Understanding level derived from total points
                "understanding_level": assessment.get("understanding_level", "partial"),
                "clarity": assessment.get("clarity", "clear"),
                "confidence_score": float(assessment.get("confidence_score", 0.5)),
                # Evidence for each rubric dimension
                "evidence": assessment.get("evidence", {}),
                "reasoning": assessment.get("reasoning", {}),
                # Specific feedback
                "misconceptions": assessment.get("misconceptions", []),
                "strengths": assessment.get("strengths", []),
                "areas_for_improvement": assessment.get("areas_for_improvement", []),
                "suggested_follow_up": assessment.get("suggested_follow_up", "Can you elaborate on that?"),
            }
            
            # Calculate total_points from rubric if not provided
            if "rubric_scores" in assessment and "total_points" not in assessment:
                normalized["total_points"] = sum(normalized["rubric_scores"].values())
            
            logger.info(
                f"Assessment V2 complete: {normalized['understanding_level']}, "
                f"rubric={normalized['total_points']}/20, "
                f"confidence={normalized['confidence_score']:.2f}"
            )
            
            return normalized
            
        except Exception as e:
            logger.error(f"Assessment failed: {e}")
            # Return a fallback assessment with rubric structure
            return {
                "rubric_scores": {
                    "concept_identification": 2,
                    "explanation_quality": 2,
                    "understanding_depth": 2,
                    "real_world_application": 2
                },
                "total_points": 8,
                "understanding_level": "partial",
                "clarity": "clear",
                "confidence_score": 0.5,
                "evidence": {},
                "reasoning": {},
                "misconceptions": [],
                "strengths": ["Attempted to answer the question"],
                "areas_for_improvement": ["Could not fully assess due to error"],
                "suggested_follow_up": "Can you explain that in more detail?",
                "error": str(e)
            }
    
    def generate_final_assessment(
        self,
        code: str,
        conversation_history: List[Dict[str, str]],
        score_breakdown: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Generate a final comprehensive assessment of the viva session.
        
        Args:
            code: Student's code submission
            conversation_history: Complete conversation from the session
            score_breakdown: Pre-calculated score breakdown from assessment engine
        
        Returns:
            Dict with final assessment details including LLM-generated narrative
        """
        self.initialize()
        
        from prompts import FINAL_ASSESSMENT_PROMPT
        import json
        
        conversation_text = "\n".join([
            f"{turn.get('role', 'unknown').upper()}: {turn.get('content', '')}"
            for turn in conversation_history
        ])
        
        # Format score breakdown for prompt
        breakdown_text = ""
        if score_breakdown:
            breakdown_text = f"""
CALCULATED SCORES (from rubric-based assessment):
- Overall Score: {score_breakdown.get('overall_score', 0)}/100
- Grade: {score_breakdown.get('grade', 'N/A')}
- Competency Level: {score_breakdown.get('competency_level', 'BEGINNER')}

Score Breakdown:
- Response Quality: {score_breakdown.get('score_breakdown', {}).get('response_quality', {}).get('score', 0)}/60
- Concept Mastery: {score_breakdown.get('score_breakdown', {}).get('concept_mastery', {}).get('score', 0)}/20
- Communication: {score_breakdown.get('score_breakdown', {}).get('communication', {}).get('score', 0)}/10
- Engagement: {score_breakdown.get('score_breakdown', {}).get('engagement', {}).get('score', 0)}/10

Concept Mastery Details:
{json.dumps(score_breakdown.get('concept_mastery', {}), indent=2)}
"""
        
        user_prompt = FINAL_ASSESSMENT_PROMPT.format(
            code=code,
            conversation=conversation_text,
            score_breakdown=breakdown_text or "No breakdown available"
        )
        
        try:
            logger.info("Generating final assessment with LLM...")
            
            messages = [
                {"role": "system", "content": "You are an expert programming instructor providing evidence-based final assessments. You MUST reference specific questions (Q1, Q2, etc.) and quote student responses. Always respond in valid JSON format."},
                {"role": "user", "content": user_prompt}
            ]
            
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.3,
                    "num_predict": 1536,  # Increased for detailed feedback
                },
                format="json"
            )
            
            result_text = response["message"]["content"].strip()
            
            try:
                llm_assessment = json.loads(result_text)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', result_text)
                if json_match:
                    llm_assessment = json.loads(json_match.group())
                else:
                    raise ValueError("Could not parse JSON from response")
            
            # Build comprehensive assessment combining calculated scores + LLM narrative
            final_assessment = {
                # Use calculated scores (accurate, evidence-based)
                "overall_score": score_breakdown.get("overall_score", 70) if score_breakdown else 70,
                "grade": score_breakdown.get("grade", "C") if score_breakdown else "C",
                "competency_level": score_breakdown.get("competency_level", "INTERMEDIATE") if score_breakdown else "INTERMEDIATE",
                "score_breakdown": score_breakdown.get("score_breakdown", {}) if score_breakdown else {},
                
                # Use LLM-generated narrative (context and explanation)
                "overall_summary": llm_assessment.get("overall_summary", "Assessment completed"),
                "strengths": llm_assessment.get("strengths", []),
                "weaknesses": llm_assessment.get("weaknesses", []),
                "misconceptions": llm_assessment.get("misconceptions", []),
                "concept_analysis": llm_assessment.get("concept_analysis", []),
                "recommendations": llm_assessment.get("recommendations", []),
                "instructor_comments": llm_assessment.get("instructor_comments", ""),
                "next_steps": llm_assessment.get("next_steps", []),
                "positive_note": llm_assessment.get("positive_note", ""),
                
                # Additional metrics from score_breakdown
                "concept_mastery": score_breakdown.get("concept_mastery", {}) if score_breakdown else {},
                "questions_answered": score_breakdown.get("questions_answered", 0) if score_breakdown else 0,
                "accuracy_rate": score_breakdown.get("accuracy_rate", 0) if score_breakdown else 0,
            }
            
            logger.info(
                f"Final assessment V2 complete: score={final_assessment['overall_score']}/100, "
                f"grade={final_assessment['grade']}, level={final_assessment['competency_level']}"
            )
            
            return final_assessment
            
        except Exception as e:
            logger.error(f"Final assessment LLM generation failed: {e}")
            # Return calculated scores with minimal narrative
            if score_breakdown:
                return {
                    **score_breakdown,
                    "overall_summary": "Assessment completed based on rubric scores.",
                    "instructor_comments": "Your performance was evaluated using a structured rubric. Review the detailed breakdown to understand your results.",
                    "error": str(e)
                }
            else:
                return {
                    "overall_score": 70,
                    "grade": "C",
                    "competency_level": "INTERMEDIATE",
                    "misconceptions": [],
                    "strengths": ["Participated in viva session"],
                    "weaknesses": ["Assessment could not be fully completed"],
                    "overall_summary": f"Assessment partially completed. Error: {str(e)}",
                    "error": str(e)
                }
    
    @property
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        try:
            import ollama
            client = ollama.Client(host=settings.OLLAMA_HOST)
            client.list()
            return True
        except:
            return False


# Singleton instances for the services
asr_service = ASRService()
tts_service = TTSService()
llm_service = LLMService()

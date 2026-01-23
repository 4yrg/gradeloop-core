"""
TTS (Text-to-Speech) Service with multiple backend support for macOS
"""
import os
import sys
import tempfile
import subprocess
from typing import Optional


class TTSService:
    """Service for converting text to speech using multiple backends"""
    
    def __init__(self, model_name: Optional[str] = None):
        """Initialize TTS service with fallback support"""
        self.backend = None
        self.tts_engine = None
        
        print(f"Initializing TTS service for macOS...")
        
        # Try gTTS first (fast and reliable)
        try:
            from gtts import gTTS
            self.backend = "gtts"
            self.gTTS = gTTS
            print(f"✓ TTS Service initialized with gTTS (Google Text-to-Speech)")
            return
        except ImportError:
            print("  gTTS not available, trying pyttsx3...")
        
        # Try pyttsx3 (offline)
        try:
            import pyttsx3
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)
            self.tts_engine.setProperty('volume', 0.9)
            self.backend = "pyttsx3"
            print(f"✓ TTS Service initialized with pyttsx3 (offline)")
            return
        except Exception as e:
            print(f"  pyttsx3 not available: {e}")
        
        # Fallback to macOS 'say' command
        if sys.platform == "darwin":
            try:
                subprocess.run(["say", "-v", "?"], capture_output=True, check=True)
                self.backend = "macos_say"
                print(f"✓ TTS Service initialized with macOS 'say' command")
                return
            except Exception as e:
                print(f"  macOS say command not available: {e}")
        
        raise Exception("No TTS backend available!")
    
    def synthesize(self, text: str) -> bytes:
        """Convert text to speech audio"""
        try:
            if self.backend == "gtts":
                return self._synthesize_gtts(text)
            elif self.backend == "pyttsx3":
                return self._synthesize_pyttsx3(text)
            elif self.backend == "macos_say":
                return self._synthesize_macos_say(text)
            else:
                raise Exception("No TTS backend initialized")
        except Exception as e:
            print(f"Error during TTS synthesis: {e}")
            raise Exception(f"TTS synthesis failed: {str(e)}")
    
    def _synthesize_gtts(self, text: str) -> bytes:
        """Synthesize using Google TTS"""
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                temp_file_path = temp_file.name
            
            tts = self.gTTS(text=text, lang='en', slow=False)
            tts.save(temp_file_path)
            
            with open(temp_file_path, 'rb') as f:
                audio_bytes = f.read()
            
            return audio_bytes
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def _synthesize_pyttsx3(self, text: str) -> bytes:
        """Synthesize using pyttsx3 offline TTS"""
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file_path = temp_file.name
            
            self.tts_engine.save_to_file(text, temp_file_path)
            self.tts_engine.runAndWait()
            
            with open(temp_file_path, 'rb') as f:
                audio_bytes = f.read()
            
            return audio_bytes
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def _synthesize_macos_say(self, text: str) -> bytes:
        """Synthesize using macOS built-in 'say' command"""
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".aiff") as temp_file:
                temp_file_path = temp_file.name
            
            subprocess.run(
                ["say", "-v", "Samantha", "-o", temp_file_path, text],
                check=True,
                capture_output=True
            )
            
            with open(temp_file_path, 'rb') as f:
                audio_bytes = f.read()
            
            return audio_bytes
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def synthesize_to_file(self, text: str, output_path: str):
        """Generate speech and save directly to a file"""
        try:
            audio_bytes = self.synthesize(text)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            print(f"✓ Audio saved to {output_path}")
        except Exception as e:
            print(f"Error saving TTS to file: {e}")
            raise

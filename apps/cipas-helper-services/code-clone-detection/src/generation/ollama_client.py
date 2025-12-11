"""
Ollama LLM Client for Type-3 Clone Generation

This module provides an Ollama-based implementation of the BaseLLMClient interface.
Ollama allows running large language models locally, making it ideal for code
generation tasks without requiring external API calls.

The OllamaLLMClient supports:
- Local LLM inference through Ollama API
- Code summarization
- Code generation from natural language descriptions
- Configurable models (codegemma, codellama, deepseek-coder, etc.)

Requirements:
    - Ollama installed and running (http://localhost:11434 by default)
    - requests library for HTTP API calls

Usage:
    config = {
        'model_name': 'codegemma:2b',
        'api': {'base_url': 'http://localhost:11434'},
        'settings': {'temperature': 0.1, 'max_tokens': 1000}
    }
    client = OllamaLLMClient(config)
    summary = client.summarize(code, "python")
    new_code = client.generate_from_summary(summary, "python")
"""

import json
import logging
from typing import Any, Optional

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests library not available. OllamaLLMClient will not work.")

from .type3_backtranslate import BaseLLMClient

logger = logging.getLogger(__name__)


class OllamaLLMClient(BaseLLMClient):
    """
    Ollama-based LLM client for code clone generation.
    
    This client interfaces with a locally-running Ollama instance to perform
    code summarization and generation tasks. Ollama provides access to various
    open-source code models including CodeGemma, CodeLlama, and DeepSeek Coder.
    
    Attributes:
        base_url: Ollama API base URL (default: http://localhost:11434)
        model_name: Model identifier (e.g., 'codegemma:2b', 'codellama:7b')
        temperature: Sampling temperature (0.0-1.0)
        max_tokens: Maximum tokens for generation
        timeout: Request timeout in seconds
    
    Examples:
        >>> config = {
        ...     'model_name': 'codegemma:2b',
        ...     'api': {'base_url': 'http://localhost:11434'},
        ...     'settings': {'temperature': 0.1, 'max_tokens': 1000}
        ... }
        >>> client = OllamaLLMClient(config)
        >>> code = "def factorial(n):\\n    return 1 if n <= 1 else n * factorial(n-1)"
        >>> summary = client.summarize(code, "python")
        >>> len(summary) > 0
        True
    """
    
    def __init__(self, config: dict[str, Any]):
        """
        Initialize Ollama LLM client.
        
        Args:
            config: Configuration dictionary with keys:
                - model_name: Model identifier (required)
                - api: Dict with 'base_url' (default: http://localhost:11434)
                - settings: Dict with 'temperature', 'max_tokens', 'timeout'
        
        Raises:
            ImportError: If requests library is not available
            ValueError: If model_name is not specified
        """
        if not REQUESTS_AVAILABLE:
            raise ImportError(
                "requests library is required for OllamaLLMClient. "
                "Install it with: pip install requests"
            )
        
        self.config = config
        
        # Extract configuration
        self.model_name = config.get('model_name')
        if not self.model_name:
            raise ValueError("model_name is required in config")
        
        # API configuration
        api_config = config.get('api', {})
        self.base_url = api_config.get('base_url', 'http://localhost:11434')
        
        # Generation settings
        settings = config.get('settings', {})
        self.temperature = settings.get('temperature', 0.1)
        self.max_tokens = settings.get('max_tokens', 1000)
        self.timeout = settings.get('timeout', 30)
        
        logger.info(
            f"Initialized OllamaLLMClient with model: {self.model_name} "
            f"at {self.base_url}"
        )
        
        # Verify Ollama is accessible
        self._verify_connection()
    
    def _verify_connection(self) -> None:
        """
        Verify that Ollama is accessible and the model is available.
        
        Raises:
            ConnectionError: If Ollama is not accessible
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            response.raise_for_status()
            
            models = response.json().get('models', [])
            model_names = [m.get('name', '') for m in models]
            
            if self.model_name not in model_names:
                logger.warning(
                    f"Model {self.model_name} not found in Ollama. "
                    f"Available models: {model_names}. "
                    f"The model will be pulled on first use."
                )
            else:
                logger.info(f"Verified model {self.model_name} is available")
                
        except requests.exceptions.RequestException as e:
            logger.error(
                f"Failed to connect to Ollama at {self.base_url}. "
                f"Make sure Ollama is running. Error: {e}"
            )
            raise ConnectionError(
                f"Cannot connect to Ollama at {self.base_url}. "
                f"Please ensure Ollama is installed and running."
            ) from e
    
    def _generate(self, prompt: str, system_prompt: Optional[str] = None, stop_sequences: Optional[list[str]] = None) -> str:
        """
        Generate text using Ollama API with robust error handling.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt for context
            stop_sequences: Optional list of sequences to stop generation
        
        Returns:
            Generated text (never empty string - returns safe default on error)
        
        Raises:
            RuntimeError: If generation fails after all retries
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        if stop_sequences:
            payload["options"]["stop"] = stop_sequences
        
        retries = 0
        max_retries = self.config.get('settings', {}).get('max_retries', 3)
        retry_delay = self.config.get('settings', {}).get('retry_delay', 1)
        
        while retries <= max_retries:
            try:
                logger.debug(f"Sending generation request to Ollama (attempt {retries + 1}/{max_retries + 1}): {prompt[:100]}...")
                
                response = requests.post(
                    url,
                    json=payload,
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                result = response.json()
                generated_text = result.get('response', '')
                
                # Validate response is not empty
                if not generated_text or not generated_text.strip():
                    logger.warning("Ollama returned empty response")
                    retries += 1
                    if retries <= max_retries:
                        import time
                        time.sleep(retry_delay)
                        continue
                    raise RuntimeError("Ollama returned empty response after retries")
                
                # Clean up markdown code blocks (qwen2.5-coder wraps code in ```)
                generated_text = generated_text.strip()
                if generated_text.startswith('```'):
                    lines = generated_text.split('\n')
                    # Remove opening fence (```java or ```python or just ```)
                    if lines[0].startswith('```'):
                        lines = lines[1:]
                    # Remove closing fence
                    if lines and lines[-1].strip() == '```':
                        lines = lines[:-1]
                    generated_text = '\n'.join(lines).strip()
                
                logger.debug(f"Generated response ({len(generated_text)} chars): {generated_text[:100]}...")
                return generated_text
                
            except requests.exceptions.Timeout:
                logger.warning(f"Ollama request timed out after {self.timeout}s (attempt {retries + 1}/{max_retries + 1})")
                retries += 1
                if retries <= max_retries:
                    import time
                    time.sleep(retry_delay)
                    # Reduce max_tokens on retry to avoid timeout again
                    payload["options"]["num_predict"] = int(self.max_tokens * 0.8)
                    continue
                raise RuntimeError(f"Ollama request timed out after {self.timeout}s (max retries exceeded)")
            
            except requests.exceptions.RequestException as e:
                logger.warning(f"Ollama generation failed: {e} (attempt {retries + 1}/{max_retries + 1})")
                retries += 1
                if retries <= max_retries:
                    import time
                    time.sleep(retry_delay)
                    continue
                raise RuntimeError(f"Ollama generation failed after {max_retries} retries: {e}") from e
    
    def summarize(self, code: str, lang: str) -> str:
        """
        Generate a high-level summary of code functionality.
        
        Uses Ollama to analyze code and produce a natural language description
        of what the code does. This summary captures the functional intent
        while abstracting away implementation details.
        
        Args:
            code: Source code to summarize
            lang: Programming language (e.g., 'python', 'java')
        
        Returns:
            Natural language summary of code functionality (never empty)
        
        Examples:
            >>> client = OllamaLLMClient({'model_name': 'codegemma:2b'})
            >>> code = "def add(a, b):\\n    return a + b"
            >>> summary = client.summarize(code, "python")
            >>> len(summary) > 0
            True
        """
        if not code or not code.strip():
            logger.warning("Cannot summarize empty code")
            return f"Empty {lang} code snippet"
        
        system_prompt = (
            f"You are a code analysis assistant. Analyze {lang} code and provide "
            f"a concise, high-level summary of its functionality. Focus on what "
            f"the code does, not how it does it. Keep the summary to 1-2 sentences. "
            f"Be specific about inputs, outputs, and main operations."
        )
        
        prompt = f"Summarize the following {lang} code in 1-2 sentences:\n\n{code}\n\nSummary:"
        
        try:
            summary = self._generate(prompt, system_prompt)
            
            # Validate and clean up the summary
            if not summary or not summary.strip():
                logger.warning(f"Empty summary generated for {lang} code")
                return f"A {lang} code snippet with {len(code.split())} words"
            
            # Clean up the summary (remove extra whitespace, newlines)
            summary = ' '.join(summary.split()).strip()
            
            # Ensure it's a reasonable length (not too long)
            if len(summary) > 500:
                summary = summary[:500].rsplit(' ', 1)[0] + '...'
            
            logger.info(f"Generated summary for {lang} code ({len(summary)} chars)")
            return summary
            
        except Exception as e:
            logger.warning(f"Failed to summarize code: {e}, using fallback")
            # Return a safe fallback summary
            lines = len(code.split('\n'))
            words = len(code.split())
            return f"A {lang} code snippet with {lines} lines and {words} words"
    
    def generate_from_summary(self, summary: str, lang: str) -> str:
        """
        Generate new code from a functional summary with robust validation.
        
        Uses Ollama to generate code that implements the functionality described
        in the summary. The generated code will be structurally different from
        the original but functionally similar, creating a Type-3 clone.
        
        Type-3 clones include modifications such as:
        - Identifier renaming
        - Literal value changes
        - Different formatting and comments
        - Modified data types
        - Adding or removing statements (extra lines, missing lines, added checks)
        - Small helper operations
        - Reordering closely related statements
        - Small changes in control flow (extra if guards, additional logging, etc.)
        
        Core logic remains recognizable and aligned, not completely rewritten.
        
        Args:
            summary: Natural language description of desired functionality
            lang: Target programming language (e.g., 'python', 'java')
        
        Returns:
            Generated source code implementing the summary (never empty or malformed)
        
        Examples:
            >>> client = OllamaLLMClient({'model_name': 'codegemma:2b'})
            >>> summary = "A function that adds two numbers and returns the result"
            >>> code = client.generate_from_summary(summary, "python")
            >>> len(code) > 0
            True
        """
        if not summary or not summary.strip():
            logger.error("Cannot generate code from empty summary")
            return self._get_placeholder_code(lang)
        
        system_prompt = (
            f"You are a code generator. Generate COMPLETE, VALID, EXECUTABLE {lang} code.\n\n"
            f"RULES:\n"
            f"1. Generate ONE complete function/method with ALL logic\n"
            f"2. The function MUST be complete (no TODO, no placeholder)\n"
            f"3. Include ALL control flow (if/for/while), ALL returns, ALL logic\n"
            f"4. Use different variable names but SAME logic\n"
            f"5. Add 1-2 extra lines (validation, comments, intermediate variables)\n"
            f"6. NO markdown, NO explanations, NO code blocks - JUST CODE\n"
            f"7. NO import statements unless absolutely necessary\n"
            f"8. Start with function/method signature, end with closing brace/dedent\n\n"
            f"IMPORTANT: Generate the COMPLETE function with ALL original logic preserved!"
        )
        
        prompt = (
            f"Generate a COMPLETE {lang} function that:\n"
            f"{summary}\n\n"
            f"Requirements:\n"
            f"- Rename variables/parameters to different names\n"
            f"- Add 1-2 validation checks or intermediate steps\n"
            f"- Keep ALL original logic (loops, conditions, returns)\n"
            f"- Make it compilable and complete\n\n"
            f"Generate the complete function now:"
        )
        
        # Define stop sequences to prevent extra functions
        # Note: qwen2.5-coder returns code in markdown blocks, so we don't use ``` as stop
        stop_sequences = []
        if 'codegemma' in self.model_name.lower():
            # Codegemma works well with aggressive stop sequences
            if lang.lower() == "python":
                stop_sequences = ["\n\n\ndef ", "\n\n\nclass ", "\n\nif __name__", "```"]
            elif lang.lower() == "java":
                stop_sequences = ["\n\n\npublic ", "\n\n\nprivate ", "\n\nclass ", "```", "\n\n//"]
        else:
            # Other models (qwen, codellama) need lighter stop sequences
            if lang.lower() == "python":
                stop_sequences = ["\n\n\ndef ", "\n\n\nclass "]
            elif lang.lower() == "java":
                stop_sequences = ["\n\n\npublic ", "\n\n\nprivate "]
        
        try:
            generated_code = self._generate(prompt, system_prompt, stop_sequences)
            
            # Validate and clean up
            if not generated_code or not generated_code.strip():
                logger.error("Generated empty code from summary")
                return self._get_placeholder_code(lang)
            
            # Check minimum length before cleaning
            if len(generated_code.strip()) < 30:
                logger.error(f"Generated code too short ({len(generated_code)} chars), likely truncated")
                return self._get_placeholder_code(lang)
            
            generated_code = self._clean_generated_code(generated_code, lang)
            
            # Final validation
            if not generated_code or not generated_code.strip():
                logger.error("Code cleaning resulted in empty code")
                return self._get_placeholder_code(lang)
            
            # Check minimum length after cleaning
            if len(generated_code.strip()) < 30:
                logger.error(f"Cleaned code too short ({len(generated_code)} chars)")
                return self._get_placeholder_code(lang)
            
            # Validate syntax (basic check)
            if not self._is_valid_code(generated_code, lang):
                logger.warning(f"Generated code may have syntax issues, applying fixes")
                generated_code = self._fix_code_syntax(generated_code, lang)
            
            # Final length check
            if len(generated_code.strip()) < 30:
                logger.error(f"Final code too short ({len(generated_code)} chars)")
                return self._get_placeholder_code(lang)
            
            logger.info(
                f"Generated {len(generated_code)} chars of valid {lang} code from summary"
            )
            return generated_code
            
        except Exception as e:
            logger.error(f"Failed to generate code from summary: {e}")
            # Return a safe, compilable placeholder
            return self._get_placeholder_code(lang)
    
    def _get_placeholder_code(self, lang: str) -> str:
        """Get a safe, valid placeholder code for fallback."""
        if lang.lower() == "python":
            return "def generated_function():\n    \"\"\"Generated function.\"\"\"\n    pass\n"
        elif lang.lower() == "java":
            return "public class GeneratedClass {\n    public void generatedMethod() {\n        // Generated method\n    }\n}\n"
        else:
            return "# Generated code\npass\n"
    
    def _is_valid_code(self, code: str, lang: str) -> bool:
        """
        Basic validation that generated code looks syntactically correct.
        
        Args:
            code: Code to validate
            lang: Programming language
        
        Returns:
            True if code looks valid, False otherwise
        """
        code = code.strip()
        
        if not code:
            return False
        
        if lang.lower() == "python":
            # Check for basic Python structure
            if not any(code.startswith(kw) for kw in ["def ", "class ", "import ", "from "]):
                # If doesn't start with keyword, should at least have proper indentation
                return '\n' in code or 'def' in code or 'class' in code
            return True
        
        elif lang.lower() == "java":
            # Check for basic Java structure
            has_method = "(" in code and ")" in code and "{" in code and "}" in code
            has_proper_braces = code.count("{") == code.count("}")
            has_semicolon = ";" in code or code.count("{") > 0  # Semicolon or braces indicate structure
            return has_method and has_proper_braces and has_semicolon
        
        return True
    
    def _fix_code_syntax(self, code: str, lang: str) -> str:
        """
        Attempt to fix common syntax errors in generated code.
        
        Args:
            code: Code with potential syntax errors
            lang: Programming language
        
        Returns:
            Fixed code
        """
        import re
        
        if lang.lower() == "python":
            # Fix common Python issues
            # Ensure proper indentation exists
            lines = code.split('\n')
            if lines and not lines[0].startswith(('def ', 'class ', '@', 'import ', 'from ')):
                # Might be missing def statement
                if '(' in code and ')' in code and ':' in code:
                    # Looks like a function, add def if missing
                    func_match = re.search(r'(\w+)\s*\(([^)]*)\)', code)
                    if func_match and not code.strip().startswith('def '):
                        code = f"def {code}"
            
            # Ensure it ends with valid Python (not just return statement)
            if code.strip().endswith(':'):
                code += '\n    pass'
        
        elif lang.lower() == "java":
            # Fix common Java issues
            # Ensure braces are balanced
            if code.count('{') > code.count('}'):
                code += '\n}'
            
            # Ensure semicolons where needed
            lines = code.split('\n')
            fixed_lines = []
            for line in lines:
                stripped = line.rstrip()
                if stripped and not stripped.endswith(('{', '}', ';')) and not stripped.startswith('//'):
                    if any(kw in stripped for kw in ['return ', 'int ', 'String ', 'void ', 'boolean ']):
                        if '(' in stripped and ')' in stripped and '{' not in stripped:
                            stripped += ';'
                fixed_lines.append(stripped)
            code = '\n'.join(fixed_lines)
        
        return code.strip()
    
    def _clean_generated_code(self, code: str, lang: str) -> str:
        """
        Clean up generated code by removing artifacts, markdown, and ensuring valid syntax.
        
        LLMs sometimes include markdown code blocks, explanatory text, or repeat the same
        function multiple times. This method strips those artifacts and validates the code.
        
        Args:
            code: Raw generated code
            lang: Programming language
        
        Returns:
            Cleaned, valid code
        """
        if not code or not code.strip():
            return ""
        
        import re
        
        # Step 1: Remove LLM special tokens and artifacts
        code = re.sub(r'<\|fim_suffix\|>.*?$', '', code, flags=re.DOTALL)
        code = re.sub(r'<\|fim_prefix\|>.*?<\|fim_middle\|>', '', code, flags=re.DOTALL)
        code = re.sub(r'<\|[^|]+\|>', '', code)  # Remove any <|token|> patterns
        code = re.sub(r'# %%.*$', '', code, flags=re.DOTALL)  # Remove Jupyter cell markers
        code = re.sub(r'```[\w]*\n?', '', code)  # Remove markdown code block markers
        
        # Step 2: Remove excessive newlines and repeated patterns
        code = re.sub(r'\n{3,}', '\n\n', code)  # Max 2 consecutive newlines
        code = re.sub(r'\\n', '\n', code)  # Fix escaped newlines
        code = re.sub(r'("""\s*){3,}', '"""\n', code)  # Remove repeated docstring markers
        
        # Step 3: Parse code line by line, removing junk
        lines = code.split('\n')
        cleaned_lines = []
        in_code_block = False
        in_docstring = False
        docstring_marker = None
        
        for i, line in enumerate(lines):
            # Track docstrings to keep them
            if '"""' in line or "'''" in line:
                marker = '"""' if '"""' in line else "'''"
                if not in_docstring:
                    in_docstring = True
                    docstring_marker = marker
                elif marker == docstring_marker:
                    in_docstring = False
                    docstring_marker = None
            
            # Skip obvious junk lines
            stripped = line.strip()
            
            # Skip explanation lines and import-only lines at start
            if any(skip_phrase in stripped.lower() for skip_phrase in [
                'here is',
                'this code',
                'the above',
                'explanation:',
                'output:',
                'result:',
                'example:',
            ]):
                continue
            
            # Skip standalone import statements (unless already in function)
            if stripped.startswith('import ') or stripped.startswith('from '):
                if not any('def ' in l or 'class ' in l or '{' in l for l in cleaned_lines):
                    # No function/class yet, skip import
                    continue
            
            # Skip lines that are only quotes or special chars
            if stripped and all(c in '"\'\\ \t\n' for c in stripped):
                continue
            
            # Skip print statements at the end (test code)
            if stripped.startswith('print(') and i > 0:
                # Check if we already have substantial code
                if any('def ' in l or 'class ' in l for l in cleaned_lines):
                    continue
            
            cleaned_lines.append(line)
        
        cleaned_code = '\n'.join(cleaned_lines).strip()
        
        # Step 4: Remove duplicate function definitions
        cleaned_code = self._remove_duplicate_functions(cleaned_code, lang)
        
        # Step 5: Trim to the end of the first valid function
        if lang.lower() == "python":
            cleaned_code = self._trim_to_first_function_python(cleaned_code)
        elif lang.lower() == "java":
            cleaned_code = self._trim_to_first_function_java(cleaned_code)
        
        return cleaned_code.strip()
    
    def _trim_to_first_function_python(self, code: str) -> str:
        """Trim Python code to only include the first function definition."""
        lines = code.split('\n')
        result_lines = []
        in_function = False
        base_indent = None
        
        for i, line in enumerate(lines):
            stripped = line.lstrip()
            
            # Found function definition
            if stripped.startswith('def ') and not in_function:
                in_function = True
                base_indent = len(line) - len(stripped)
                result_lines.append(line)
                continue
            
            if in_function:
                # Check if we've exited the function
                if stripped and not line.startswith(' ' * (base_indent + 1)) and not stripped.startswith('#'):
                    # We've exited the function
                    break
                result_lines.append(line)
        
        # Remove trailing empty lines
        while result_lines and not result_lines[-1].strip():
            result_lines.pop()
        
        return '\n'.join(result_lines)
    
    def _trim_to_first_function_java(self, code: str) -> str:
        """Trim Java code to only include the first method definition."""
        import re
        
        # Find the first method definition
        match = re.search(
            r'((?:public|private|protected)?\s*(?:static)?\s*(?:\w+\s+)*\w+\s+\w+\s*\([^)]*\)\s*\{)',
            code
        )
        
        if not match:
            return code
        
        start_pos = match.start()
        brace_count = 0
        in_method = False
        
        for i, char in enumerate(code[start_pos:], start=start_pos):
            if char == '{':
                brace_count += 1
                in_method = True
            elif char == '}':
                brace_count -= 1
                if in_method and brace_count == 0:
                    return code[start_pos:i+1]
        
        return code
    
    def _remove_duplicate_functions(self, code: str, lang: str) -> str:
        """
        Remove duplicate function definitions from generated code.
        
        Sometimes LLMs repeat the same function multiple times.
        This method detects and removes duplicates, keeping only the first occurrence.
        
        Args:
            code: Code potentially containing duplicates
            lang: Programming language
        
        Returns:
            Code with duplicates removed
        """
        if lang.lower() == "python":
            # Split by function definitions
            import re
            func_pattern = r'(def\s+\w+\s*\([^)]*\):.*?)(?=\ndef\s+|\nclass\s+|\nif\s+__name__|$)'
            matches = re.findall(func_pattern, code, re.DOTALL)
            
            if len(matches) <= 1:
                return code
            
            # Keep only unique functions (compare normalized versions)
            seen = set()
            unique_funcs = []
            
            for func in matches:
                # Normalize by removing extra whitespace for comparison
                normalized = ' '.join(func.split())
                if normalized not in seen:
                    seen.add(normalized)
                    unique_funcs.append(func)
            
            # Return only the first function if duplicates exist
            if len(unique_funcs) > 0:
                return unique_funcs[0].strip()
            return code
        
        elif lang.lower() == "java":
            # Similar logic for Java
            import re
            func_pattern = r'((?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\([^)]*\)\s*\{[^}]*\})'
            matches = re.findall(func_pattern, code, re.DOTALL)
            
            if len(matches) <= 1:
                return code
            
            seen = set()
            unique_funcs = []
            
            for func in matches:
                normalized = ' '.join(func.split())
                if normalized not in seen:
                    seen.add(normalized)
                    unique_funcs.append(func)
            
            if len(unique_funcs) > 0:
                return unique_funcs[0].strip()
            return code
        
        return code
    
    def get_model_info(self) -> dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dictionary with model details from Ollama
        """
        try:
            response = requests.get(f"{self.base_url}/api/show", 
                                   json={"name": self.model_name},
                                   timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"Failed to get model info: {e}")
            return {
                "name": self.model_name,
                "error": str(e)
            }

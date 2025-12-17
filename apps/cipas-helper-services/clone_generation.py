import requests
import time

OLLAMA_API_TIMEOUT = 120  # Increase timeout to 120 seconds
OLLAMA_API_MAX_RETRIES = 3

def call_ollama_api_with_timeout(payload):
    retries = 0
    backoff = 2
    while retries < OLLAMA_API_MAX_RETRIES:
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json=payload,
                timeout=OLLAMA_API_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            print(f"[MODEL ERROR] Ollama API timeout (attempt {retries+1}/{OLLAMA_API_MAX_RETRIES}), retrying in {backoff}s...")
            retries += 1
            time.sleep(backoff)
            backoff *= 2  # Exponential backoff
        except Exception as e:
            print(f"[MODEL ERROR] Ollama API error: {e}")
            break
    print("[MODEL ERROR] Ollama API timeout after retries. Skipping this attempt.")
    return None

# Example integration in your main loop:
for idx, payload in enumerate(payloads):  # assuming you loop over payloads
    # ...existing code...
    result = call_ollama_api_with_timeout(payload)
    if result is None:
        # Optionally log or handle skipped item
        continue
    # ...process result as before...
    # ...existing code...

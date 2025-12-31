# Model paths and GPU settings [cite: 158]
import os

MODEL_PATH = os.getenv("MODEL_PATH", "apps/cipas/semantic/models/unixcoder_weights")
USE_GPU = os.getenv("USE_GPU", "False").lower() == "true"

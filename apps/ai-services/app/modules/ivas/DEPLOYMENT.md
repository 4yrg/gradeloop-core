# IVAS Performance & Deployment Guide

## Current Setup (Development - Mac)

**Hardware:** Apple Silicon (M-series)
**Performance:**
- ✅ ASR (Speech Recognition): Real-time (~1x audio duration)
- ⚠️ TTS (Speech Synthesis): 3-6 seconds per response
- ✅ LLM: Fast with Ollama local

## The Problem

**XTTS v2 on CPU is too slow for real-time conversation:**
- Student speaks → ASR transcribes (fast) → LLM responds (fast) → **TTS takes 3-6 seconds** ❌
- Users expect <1 second total response time for natural conversation

## The Solution

### Development (Current - Mac/CPU)
```bash
# Use CPU for development/testing
# Accepts slower TTS (3-6s) for testing logic
python test_xtts.py  # Works but slow
```

**Pros:**
- ✅ Works on local Mac
- ✅ High quality natural voice
- ✅ Test full pipeline

**Cons:**
- ❌ Too slow for real user testing
- ❌ 3-6 second delays feel unnatural

### Production (Deploy with GPU)

Deploy on cloud server with NVIDIA GPU for real-time performance:

```bash
# With NVIDIA GPU: 0.5-1 second TTS ✅
# Total response time: <1.5 seconds (natural conversation)
```

## Deployment Options

### Option 1: AWS EC2 (Recommended)
```bash
# Instance: g4dn.xlarge
# GPU: NVIDIA T4
# Cost: ~$0.50/hour
# TTS Speed: 0.5-1 second ✅

# Setup:
1. Launch EC2 g4dn.xlarge instance
2. Install CUDA toolkit
3. Install dependencies with GPU support
4. Deploy IVAS service
```

### Option 2: Google Cloud
```bash
# Instance: n1-standard-4 + T4 GPU
# GPU: NVIDIA Tesla T4
# Cost: ~$0.40/hour
```

### Option 3: Azure
```bash
# Instance: NC-series
# GPU: NVIDIA K80/P100
# Cost: ~$0.90/hour
```

### Option 4: RunPod (Cheapest for Testing)
```bash
# Community GPU rentals
# GPU: RTX 3090
# Cost: ~$0.20/hour
# Best for: Development testing with GPU
```

## Performance Comparison

| Environment | Hardware | TTS Speed | Real-time? | Cost |
|-------------|----------|-----------|------------|------|
| **Local Mac** | Apple M2/M3 (CPU) | 3-6 sec | ❌ No | Free |
| **AWS g4dn** | NVIDIA T4 | 0.5-1 sec | ✅ Yes | $0.50/hr |
| **GCP T4** | NVIDIA T4 | 0.5-1 sec | ✅ Yes | $0.40/hr |
| **RunPod** | RTX 3090 | 0.3-0.7 sec | ✅ Yes | $0.20/hr |

## Quick Start (GPU Deployment)

### 1. Test locally (Development)
```bash
# Current setup - works but slow
cd apps/ai-services
python app/modules/ivas/tests/test_xtts.py
```

### 2. Deploy with GPU (Production)
```bash
# On GPU server:
export TTS_USE_GPU=true
export IVAS_ENV=production

# Install CUDA version of PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Run with GPU
python app/modules/ivas/tests/test_xtts.py
# Should see: "🚀 Using NVIDIA CUDA GPU for TTS"
# Speed: 0.5-1 second ✅
```

## Recommendation

**For your thesis project:**

1. **Phase 1 (Now - Development):** 
   - Build and test on Mac with CPU
   - Accept 3-6 second TTS delays
   - Focus on logic and conversation flow

2. **Phase 2 (User Testing):**
   - Deploy on RunPod or AWS with GPU
   - Test with real students
   - <1 second response feels natural ✅

3. **Phase 3 (Production):**
   - Deploy on AWS/GCP with autoscaling
   - Monitor performance
   - Optimize based on usage

## Alternative: Faster Model (Not Recommended)

If you need instant response NOW without GPU:
- Use Piper TTS (0.1-0.2 seconds on CPU)
- Trade-off: Less natural voice (robotic)
- Good for: Quick demos, but not final product

**My strong recommendation:** Keep XTTS with natural voice, plan GPU deployment for user testing.

## Configuration

See `config.py` for environment variables:
```bash
# Development (CPU)
export IVAS_ENV=development

# Production (GPU)
export IVAS_ENV=production
export TTS_USE_GPU=true
```

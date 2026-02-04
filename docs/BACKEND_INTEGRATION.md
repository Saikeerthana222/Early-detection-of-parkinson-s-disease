# Parkinson's Disease Detection System - Backend Integration Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Setup](#backend-setup)
4. [API Endpoints](#api-endpoints)
5. [Frontend Configuration](#frontend-configuration)
6. [Model Integration](#model-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses a **React frontend** that communicates with a **Python Flask backend** for Parkinson's Disease detection through handwriting analysis.

### Technology Stack
- **Frontend**: React + TypeScript + Vite (hosted on Lovable)
- **Backend**: Python Flask + TensorFlow
- **ML Model**: VGG16 fine-tuned Keras model

### Communication Flow
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ──────► │   Flask API     │ ──────► │  TensorFlow     │
│  (Lovable)      │  HTTP   │  (Your Server)  │         │  Model          │
│                 │ ◄────── │                 │ ◄────── │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## Architecture

### Frontend Files (Already Created)
| File | Purpose |
|------|---------|
| `src/lib/api.ts` | API client with all backend communication functions |
| `src/pages/AssessmentPage.tsx` | Handles image uploads and calls prediction API |
| `src/pages/ResultsPage.tsx` | Displays results from backend |

### Backend Files (You Need to Create)
```
backend/
├── models/
│   ├── .gitkeep
│   └── vgg16_parkinson_finetuned.keras    ← YOUR MODEL FILE
├── uploads/
│   └── .gitkeep
├── app.py                                  ← Main Flask application
├── requirements.txt                        ← Python dependencies
├── verify_setup.py                         ← Setup verification script
├── README.md                               ← Backend documentation
├── .gitignore
└── .env.example
```

---

## Backend Setup

### Step 1: Create Backend Directory Structure

Create a new folder called `backend` on your local machine or server:

```bash
mkdir backend
cd backend
mkdir models uploads
touch models/.gitkeep uploads/.gitkeep
```

### Step 2: Create requirements.txt

```txt
flask==3.0.0
flask-cors==4.0.0
tensorflow==2.15.0
pillow==10.1.0
numpy==1.24.3
python-multipart==0.0.6
werkzeug==3.0.0
python-dotenv==1.0.0
```

### Step 3: Create app.py

```python
import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from datetime import datetime

app = Flask(__name__)

# CORS Configuration - IMPORTANT!
# Allow requests from your Lovable frontend
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.lovableproject.com",
    "https://*.lovable.app",
    "*"  # For development - restrict in production
])

# ============================================================================
# MODEL LOADING
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'vgg16_parkinson_finetuned.keras')

# Try to load model
model = None
if os.path.exists(MODEL_PATH):
    try:
        print(f"Loading model from: {MODEL_PATH}")
        model = tf.keras.models.load_model(MODEL_PATH)
        print("✓ Model loaded successfully!")
        print(f"  Input shape: {model.input_shape}")
        print(f"  Output shape: {model.output_shape}")
    except Exception as e:
        print(f"❌ Failed to load model: {str(e)}")
        model = None
else:
    print(f"⚠ Model file not found: {MODEL_PATH}")
    print("  Server will run but predictions will fail until model is uploaded.")

# ============================================================================
# IMAGE PREPROCESSING
# ============================================================================

def preprocess_image(image_file):
    """
    Preprocess image for VGG16 model
    Input: File object
    Output: Numpy array (1, 100, 100, 3) normalized to [0, 1]
    """
    try:
        if hasattr(image_file, 'stream'):
            image = Image.open(image_file.stream)
        else:
            image = Image.open(image_file)
        
        # Convert to RGB
        image = image.convert('RGB')
        
        # Resize to 100x100 (model input size)
        image = image.resize((100, 100), Image.Resampling.LANCZOS)
        
        # Normalize to [0, 1]
        image_array = np.array(image, dtype=np.float32) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {str(e)}")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_age_adjustment(age, base_score):
    """Adjust prediction based on patient age"""
    if age < 40:
        return base_score * 0.7, True, "Results adjusted for younger age group - lower reliability"
    elif age >= 40 and age < 60:
        return base_score, True, "Early-onset range - consider additional screening if elevated"
    else:
        return base_score, False, "Standard age-appropriate analysis"

def aggregate_predictions(predictions, age, medical_history):
    """Combine 5 image predictions into overall assessment"""
    avg_pd_probability = np.mean([pred[1] for pred in predictions])
    adjusted_score, age_adjusted, age_context = calculate_age_adjustment(age, avg_pd_probability)
    
    if medical_history:
        adjusted_score = adjusted_score * 0.9
        age_context += " | Pre-existing motor conditions noted"
    
    risk_percentage = round(adjusted_score * 100, 2)
    
    if risk_percentage <= 30:
        risk_level = "low"
    elif risk_percentage <= 60:
        risk_level = "moderate"
    elif risk_percentage <= 85:
        risk_level = "elevated"
    else:
        risk_level = "high"
    
    return risk_percentage, risk_level, age_adjusted, age_context

def generate_image_note(score, task_type):
    """Generate note for each image based on score"""
    if score < 30:
        return f"{task_type}: Normal pattern detected"
    elif score < 60:
        return f"{task_type}: Minor irregularities observed"
    elif score < 85:
        return f"{task_type}: Significant pattern deviation - consistent with PD"
    else:
        return f"{task_type}: Strong indicators present"

def generate_recommendations(risk_level, age, family_history):
    """Generate personalized recommendations"""
    recommendations = []
    
    if risk_level == "low":
        recommendations.append("Continue monitoring symptoms annually")
        recommendations.append("Maintain healthy lifestyle with regular exercise")
        if family_history:
            recommendations.append("Given family history, consider screening every 6 months")
    elif risk_level == "moderate":
        recommendations.append("Schedule appointment with neurologist within 3-6 months")
        recommendations.append("Keep a symptom diary to track any changes")
        recommendations.append("Consider repeating this assessment in 3 months")
    elif risk_level == "elevated":
        recommendations.append("Schedule appointment with movement disorder specialist within 6-8 weeks")
        recommendations.append("Discuss additional diagnostic tests (DaTscan, MRI)")
        recommendations.append("Document all motor and non-motor symptoms")
    else:
        recommendations.append("Seek medical evaluation from a neurologist within 2-4 weeks")
        recommendations.append("Request comprehensive Parkinson's assessment")
        recommendations.append("Prepare list of all symptoms and family history for appointment")
    
    if age < 45:
        recommendations.append("Note: Young-onset PD requires specialized evaluation")
    
    return recommendations

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'version': '1.0.0'
    })

@app.route('/api/model-status', methods=['GET'])
def model_status():
    """Detailed model status"""
    if model is None:
        return jsonify({
            'loaded': False,
            'message': 'Model file not found. Please upload vgg16_parkinson_finetuned.keras to backend/models/',
            'expected_path': MODEL_PATH
        }), 503
    
    return jsonify({
        'loaded': True,
        'model_path': str(MODEL_PATH),
        'input_shape': str(model.input_shape),
        'output_shape': str(model.output_shape),
        'total_params': int(model.count_params())
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please upload the model file to backend/models/'
            }), 503
        
        # Extract patient metadata
        age = int(request.form.get('age', 0))
        gender = request.form.get('gender', '')
        handedness = request.form.get('handedness', '')
        medical_history = request.form.get('medicalHistory', 'false').lower() == 'true'
        family_history = request.form.get('familyHistory', 'false').lower() == 'true'
        
        # Validate age
        if age < 18 or age > 100:
            return jsonify({
                'success': False,
                'error': 'Age must be between 18 and 100'
            }), 400
        
        # Get uploaded images
        images = request.files.getlist('images')
        
        if len(images) != 5:
            return jsonify({
                'success': False,
                'error': f'Expected exactly 5 images, received {len(images)}'
            }), 400
        
        # Process each image
        predictions = []
        individual_scores = []
        
        task_types = [
            "Clockwise Spiral",
            "Counterclockwise Spiral",
            "Handwriting Sample",
            "Dot Connection",
            "Signature"
        ]
        
        for idx, image_file in enumerate(images):
            processed_image = preprocess_image(image_file)
            prediction = model.predict(processed_image, verbose=0)[0]
            predictions.append(prediction)
            
            pd_probability = float(prediction[1])
            pd_percentage = round(pd_probability * 100, 2)
            
            individual_scores.append({
                'imageId': idx + 1,
                'taskType': task_types[idx],
                'score': pd_percentage,
                'notes': generate_image_note(pd_percentage, task_types[idx])
            })
        
        # Calculate overall risk
        overall_risk, risk_level, age_adjusted, age_context = aggregate_predictions(
            predictions, age, medical_history
        )
        
        # Calculate detailed metrics
        detailed_metrics = {
            'tremorScore': round(np.mean([individual_scores[0]['score'], individual_scores[1]['score']]), 2),
            'micrographiaScore': round(individual_scores[2]['score'], 2),
            'spiralConsistency': round(abs(individual_scores[0]['score'] - individual_scores[1]['score']), 2),
            'lineWaviness': round(individual_scores[3]['score'], 2),
            'speedVariation': round(float(np.std([s['score'] for s in individual_scores])), 2)
        }
        
        # Generate recommendations
        recommendations = generate_recommendations(risk_level, age, family_history)
        
        # Calculate confidence
        score_variance = float(np.var([s['score'] for s in individual_scores]))
        confidence = round(max(50, min(100, 100 - score_variance * 2)), 2)
        
        result = {
            'success': True,
            'overallRisk': overall_risk,
            'riskLevel': risk_level,
            'confidence': confidence,
            'individualScores': individual_scores,
            'detailedMetrics': detailed_metrics,
            'ageAdjusted': age_adjusted,
            'ageContext': age_context,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat(),
            'patientInfo': {
                'age': age,
                'gender': gender,
                'handedness': handedness
            }
        }
        
        return jsonify(result)
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(ve)}'
        }), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Parkinson's Detection System - Backend Server")
    print("=" * 60)
    
    if model is None:
        print("⚠ WARNING: Starting WITHOUT model loaded!")
        print("  Upload vgg16_parkinson_finetuned.keras to backend/models/")
    else:
        print("✓ Model ready")
    
    print("✓ Starting server on http://0.0.0.0:5000")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### Step 4: Create verify_setup.py

```python
#!/usr/bin/env python3
"""Verify backend setup before starting server"""

import os
import sys
from pathlib import Path

def verify_setup():
    print("\n" + "=" * 60)
    print("Parkinson's Detection System - Setup Verification")
    print("=" * 60 + "\n")
    
    errors = []
    warnings = []
    
    # Check model file
    model_path = Path(__file__).parent / 'models' / 'vgg16_parkinson_finetuned.keras'
    if not model_path.exists():
        errors.append(f"❌ Model file not found: {model_path}")
        errors.append("   ACTION: Upload 'vgg16_parkinson_finetuned.keras' to backend/models/")
    else:
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✓ Model file found ({size_mb:.2f} MB)")
    
    # Check dependencies
    try:
        import tensorflow as tf
        print(f"✓ TensorFlow: {tf.__version__}")
    except ImportError:
        errors.append("❌ TensorFlow not installed")
    
    try:
        import flask
        print(f"✓ Flask: {flask.__version__}")
    except ImportError:
        errors.append("❌ Flask not installed")
    
    try:
        from PIL import Image
        print(f"✓ Pillow installed")
    except ImportError:
        errors.append("❌ Pillow not installed")
    
    # Print results
    print("\n" + "=" * 60)
    
    if errors:
        print("❌ ERRORS - Fix before running:")
        for error in errors:
            print(error)
        sys.exit(1)
    
    print("✓ ALL CHECKS PASSED!")
    print("Run: python app.py")

if __name__ == '__main__':
    verify_setup()
```

### Step 5: Create .gitignore

```
__pycache__/
*.py[cod]
*.so
.Python
env/
venv/
*.egg-info/
dist/
build/

# Model files (upload manually)
models/*.keras
models/*.h5

# Uploads
uploads/*
!uploads/.gitkeep

# Environment
.env
.env.local

# Logs
*.log
```

### Step 6: Create .env.example

```
# Backend Configuration
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5000

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://your-project.lovable.app
```

---

## API Endpoints

### 1. Health Check
```
GET /api/health

Response:
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### 2. Model Status
```
GET /api/model-status

Response:
{
  "loaded": true,
  "model_path": "/path/to/model",
  "input_shape": "(None, 100, 100, 3)",
  "output_shape": "(None, 2)",
  "total_params": 42443720
}
```

### 3. Predict
```
POST /api/predict
Content-Type: multipart/form-data

Form Data:
- images: File[] (exactly 5 images)
- age: number (18-100)
- gender: string
- handedness: string
- medicalHistory: boolean
- familyHistory: boolean

Response:
{
  "success": true,
  "overallRisk": 45.5,
  "riskLevel": "moderate",
  "confidence": 85.2,
  "individualScores": [...],
  "detailedMetrics": {...},
  "ageAdjusted": false,
  "ageContext": "Standard age-appropriate analysis",
  "recommendations": [...],
  "timestamp": "2024-01-15T10:30:00Z",
  "patientInfo": {...}
}
```

---

## Frontend Configuration

### Current Setup (src/lib/api.ts)

The frontend is configured to connect to:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Option 1: Local Development (Default)
No changes needed. The frontend will connect to `http://localhost:5000/api`

### Option 2: Custom Backend URL
Create a `.env` file in the frontend root (if deploying backend elsewhere):

```env
VITE_API_URL=https://your-backend-server.com/api
```

---

## Model Integration

### Model Specifications
| Property | Value |
|----------|-------|
| File Name | `vgg16_parkinson_finetuned.keras` |
| Input Shape | (None, 100, 100, 3) |
| Output Shape | (None, 2) |
| Classes | [Healthy, Parkinson's] |
| Expected Size | ~162 MB |

### Upload Location
Place your model file at:
```
backend/models/vgg16_parkinson_finetuned.keras
```

---

## Testing

### Step 1: Start Backend
```bash
cd backend
pip install -r requirements.txt
python verify_setup.py  # Check everything is ready
python app.py           # Start server
```

### Step 2: Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status": "healthy", "model_loaded": true, "version": "1.0.0"}
```

### Step 3: Test from Frontend
Open your Lovable app and navigate to the Assessment page.

---

## Deployment

### For Production

1. **Backend Hosting Options:**
   - AWS EC2 / Lambda
   - Google Cloud Run
   - Heroku
   - Railway
   - DigitalOcean

2. **Update Frontend Environment:**
   Add to your Lovable project secrets:
   ```
   VITE_API_URL=https://your-production-backend.com/api
   ```

3. **CORS Configuration:**
   Update `app.py` to only allow your production domain:
   ```python
   CORS(app, origins=[
       "https://your-project.lovable.app"
   ])
   ```

---

## Troubleshooting

### Error: "Backend Not Available"
- **Cause**: Backend server is not running
- **Fix**: Start the Flask server: `python app.py`

### Error: "Model not loaded"
- **Cause**: Model file missing
- **Fix**: Upload `vgg16_parkinson_finetuned.keras` to `backend/models/`

### Error: CORS Issues
- **Cause**: Backend not allowing frontend origin
- **Fix**: Update CORS configuration in `app.py`

### Error: TensorFlow Version Mismatch
- **Cause**: Model saved with different TensorFlow version
- **Fix**: Install matching version: `pip install tensorflow==2.15.0`

---

## Quick Start Checklist

- [ ] Create `backend/` directory
- [ ] Create all files (app.py, requirements.txt, etc.)
- [ ] Run `pip install -r requirements.txt`
- [ ] Upload your `.keras` model to `backend/models/`
- [ ] Run `python verify_setup.py`
- [ ] Start server with `python app.py`
- [ ] Test with `curl http://localhost:5000/api/health`
- [ ] Open frontend and complete an assessment

---

## Support

For issues with:
- **Frontend**: Check browser console for errors
- **Backend**: Check terminal output for Python errors
- **Model**: Ensure TensorFlow version compatibility
- **Network**: Verify CORS settings and firewall rules

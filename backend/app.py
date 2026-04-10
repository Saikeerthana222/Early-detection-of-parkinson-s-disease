import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import cv2  # Added for preprocessing that matches training
import io
from datetime import datetime

app = Flask(__name__)

# CORS Configuration - IMPORTANT!
# Allow requests from your Lovable frontend
CORS(app, origins=[
    "http://localhost:8080",
    "http://localhost:3000",
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
# IMAGE PREPROCESSING - UPDATED TO MATCH TRAINING
# ============================================================================

def preprocess_image(image_file):
    """
    Preprocess image for VGG16 model - MATCHES TRAINING PREPROCESSING EXACTLY
    
    Training preprocessing (from notebook):
    1. cv2.imread(GRAYSCALE)
    2. cv2.resize(100, 100)
    3. reshape(-1, 100, 100, 1)
    4. normalize / 255.0
    5. np.repeat (grayscale -> 3 channels)
    
    Input: File object
    Output: Numpy array (1, 100, 100, 3) normalized to [0, 1]
    """
    try:
        # Read image bytes from uploaded file
        if hasattr(image_file, 'stream'):
            image_bytes = image_file.stream.read()
            image_file.stream.seek(0)  # Reset stream for potential re-reading
        else:
            image_bytes = image_file.read()
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image using OpenCV as GRAYSCALE (matches training)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            raise ValueError("Could not decode image")
        
        # Resize to 100x100 using OpenCV (matches training)
        resized_img = cv2.resize(img, (100, 100))
        
        # Reshape to add channel dimension: (100, 100) -> (1, 100, 100, 1)
        img_with_channel = resized_img.reshape(1, 100, 100, 1)
        
        # Normalize pixel values to [0, 1] (matches training)
        normalized_img = img_with_channel / 255.0
        
        # Convert grayscale to 3 channels for VGG16 (matches training)
        # np.repeat along axis=-1 (channel axis)
        img_3_channel = np.repeat(normalized_img, 3, axis=-1)
        
        return img_3_channel
        
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
        'version': '2.0.0'  # Updated version with fixed preprocessing
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
            "Clockwise Spiral",
            "Wave Pattern",
            "Wave Pattern",
            "Wave Pattern"
        ]
        
        print("\n" + "=" * 60)
        print("PROCESSING IMAGES")
        print("=" * 60)
        
        for idx, image_file in enumerate(images):
            processed_image = preprocess_image(image_file)
            print(f"Image {idx+1} ({task_types[idx]}): shape={processed_image.shape}")
            
            prediction = model.predict(processed_image, verbose=0)[0]
            predictions.append(prediction)
            
            pd_probability = float(prediction[1])
            pd_percentage = round(pd_probability * 100, 2)
            
            print(f"  Prediction: Healthy={prediction[0]:.4f}, Parkinson={prediction[1]:.4f}")
            print(f"  Risk Score: {pd_percentage}%")
            
            individual_scores.append({
                'imageId': idx + 1,
                'taskType': task_types[idx],
                'score': pd_percentage,
                'notes': generate_image_note(pd_percentage, task_types[idx])
            })
        
        print("=" * 60 + "\n")
        
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
    print("Parkinson's Detection System - Backend Server v2.0")
    print("=" * 60)
    print("Updates:")
    print("  • Image preprocessing matches training exactly")
    print("  • OpenCV grayscale → 3-channel conversion")
    print("  • Supports both spiral and wave images")
    print("=" * 60)
    
    if model is None:
        print("⚠ WARNING: Starting WITHOUT model loaded!")
        print("  Upload vgg16_parkinson_finetuned.keras to backend/models/")
    else:
        print("✓ Model ready")
    
    print("✓ Starting server on http://0.0.0.0:5000")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
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
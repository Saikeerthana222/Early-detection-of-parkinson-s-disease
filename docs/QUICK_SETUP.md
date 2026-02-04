# Quick Setup Guide

## 1. Create Backend (on your local machine or server)

```bash
# Create directory
mkdir backend && cd backend
mkdir models uploads
```

## 2. Create requirements.txt
```txt
flask==3.0.0
flask-cors==4.0.0
tensorflow==2.15.0
pillow==10.1.0
numpy==1.24.3
werkzeug==3.0.0
```

## 3. Create app.py
See `docs/BACKEND_INTEGRATION.md` for full code.

## 4. Upload Model
Place `vgg16_parkinson_finetuned.keras` in `backend/models/`

## 5. Start Server
```bash
pip install -r requirements.txt
python app.py
```

## 6. Verify
```bash
curl http://localhost:5000/api/health
# Should return: {"status": "healthy", "model_loaded": true, "version": "1.0.0"}
```

## Frontend Connection
The frontend connects to: `http://localhost:5000/api` by default.

To use a different URL, set environment variable:
```
VITE_API_URL=https://your-server.com/api
```

## API Endpoints Required
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/model-status` | GET | Model status |
| `/api/predict` | POST | Run prediction |

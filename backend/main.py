from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Load model + feature order once at startup
model = joblib.load("ml/models/netguard_model.joblib")
feature_columns = joblib.load("ml/models/feature_columns.joblib")

# ----------------------------------------------------------------------
# Define the SHAPE of valid input using a Pydantic model.
# A request to /predict must contain a field "features" that is a
# list of numbers. FastAPI validates this automatically.
# ----------------------------------------------------------------------
class FlowData(BaseModel):
    features: list[float]

@app.get("/")
def read_root():
    return {"message": "NetGuard AI backend is running"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "num_features": len(feature_columns)
    }

# ----------------------------------------------------------------------
# The prediction endpoint. Note @app.post (not get): we're SENDING data,
# not just reading. POST is the request type for submitting data.
# ----------------------------------------------------------------------
@app.post("/predict")
def predict(data: FlowData):
    # Guard against wrong number of features
    if len(data.features) != len(feature_columns):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(feature_columns)} features, got {len(data.features)}"
        )

    # The model expects a 2D array: one row, 78 columns.
    # np.array([...]) makes the row; the outer [ ] makes it 2D.
    input_array = np.array([data.features])

    # Run the model
    prediction = model.predict(input_array)[0]          # 0 or 1
    probability = model.predict_proba(input_array)[0]   # [P(benign), P(attack)]

    # Translate the 0/1 back into a human-readable label
    label = "ATTACK" if prediction == 1 else "BENIGN"

    return {
        "prediction": label,
        "is_attack": bool(prediction == 1),
        "confidence": round(float(probability[prediction]), 4)
    }
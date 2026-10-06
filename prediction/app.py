"""TabPFN sidecar placeholder for Milestone 2.

The API is intentionally explicit about not predicting until real observations
exist. Keeping this service separate makes the heavier model optional locally.
"""
from fastapi import FastAPI

app = FastAPI(title="Outside Window prediction service")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/predict")
def predict() -> dict[str, str]:
    return {"status": "not_ready", "message": "Prediction arrives in Milestone 2."}

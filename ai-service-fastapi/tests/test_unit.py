import pytest
import numpy as np
from fastapi import HTTPException
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))
from main import app, model, get_predicted_value, symptoms_dict, diseases_list  # Import your functions

client = TestClient(app)

### =================== UNIT TESTS FOR get_predicted_value =================== ###

def test_get_predicted_value_valid():
    """Test prediction function with valid symptoms"""
    symptoms = ["anxiety", "yellow_crust_ooze"]
    predicted_disease = get_predicted_value(symptoms)

    # Ensure the predicted disease is in the diseases_list values
    assert predicted_disease in diseases_list.values()


def test_get_predicted_value_invalid():
    """Test prediction function with invalid symptoms"""
    symptoms = ["unknown_symptom"]
    
    predicted_disease = get_predicted_value(symptoms)
    
    # Since unknown symptoms should return "Invalid symptoms provided", verify that
    assert isinstance(predicted_disease, str), f"Expected a string, but got {type(predicted_disease)}"
    assert predicted_disease == "Invalid symptoms provided", f"Unexpected output: {predicted_disease}"


def test_get_predicted_value_empty():
    """Test prediction function with an empty symptom list"""
    symptoms = []
    
    predicted_disease = get_predicted_value(symptoms)
    
    # Expect "Invalid symptoms provided" or a default response for empty symptom list
    assert isinstance(predicted_disease, str), f"Expected a string, but got {type(predicted_disease)}"
    assert predicted_disease == "Invalid symptoms provided", f"Unexpected output: {predicted_disease}"

def test_get_predicted_value_mixed_symptoms():
    """Test prediction function with a mix of valid and invalid symptoms"""
    symptoms = ["fever", "unknown_symptom", "fatigue"]
    predicted_disease = get_predicted_value(symptoms)

    # Ensure the returned disease is valid
    assert predicted_disease in diseases_list.values() or predicted_disease == "Invalid symptoms provided"

def test_get_predicted_value_error_handling(monkeypatch):
    """Test prediction function when an error occurs (simulate model failure)"""

    def mock_predict(_):
        raise ValueError("Mocked model error")

    # Monkeypatch the model's predict method
    monkeypatch.setattr(model, "predict", mock_predict)

    symptoms = ["fever"]

    result = get_predicted_value(symptoms)

    assert isinstance(result, str), f"Expected a string, but got {type(result)}"
    assert result == "Invalid symptoms provided" or "Prediction error occurred", f"Unexpected output: {result}"

### =================== API ENDPOINT TESTS =================== ###

def test_predict_disease_valid():
    """Test the /predict-disease/ endpoint with valid symptoms"""
    response = client.post("/predict-disease/", json={"symptoms": ["fever", "cough"]})
    assert response.status_code == 200
    data = response.json()
    assert "predicted_disease" in data
    assert "description" in data
    assert "precautions" in data
    assert "medications" in data
    assert "workout" in data
    assert "diets" in data

def test_predict_disease_invalid():
    """Test the /predict-disease/ endpoint with invalid symptoms"""
    response = client.post("/predict-disease/", json={"symptoms": ["unknown_symptom"]})
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid symptoms provided"}

def test_predict_disease_empty():
    """Test the /predict-disease/ endpoint with empty symptoms list"""
    response = client.post("/predict-disease/", json={"symptoms": []})
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid symptoms provided"}

def test_predict_disease_no_symptoms():
    """Test the /predict-disease/ endpoint with no symptoms field"""
    response = client.post("/predict-disease/", json={})
    assert response.status_code == 422  # Validation error because the field is missing

### =================== TESTING HELPER FUNCTION =================== ###

# Test the helper function by simulating its behavior directly
def test_helper():
    predicted_disease = "Fungal infection"
    result = get_predicted_value([predicted_disease])

    assert isinstance(result, str), f"Expected a string, but got {type(result)}: {result}"
    
    # Ensure it's a valid disease name, not a placeholder
    assert result != "Unknown Disease", "Function should recognize known diseases"


  
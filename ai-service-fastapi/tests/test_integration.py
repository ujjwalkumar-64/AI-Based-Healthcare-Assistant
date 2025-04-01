import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from main import app  # Import FastAPI app
from fastapi.testclient import TestClient
client = TestClient(app)

### =================== INTEGRATION TESTS =================== ###

@pytest.mark.parametrize("symptoms, expected_status", [
    (["cough", "fever"], 200),
    (["itching", "skin_rash"], 200),
    (["unknown_symptom"], 400),
    ([], 400),
])
def test_predict_disease(symptoms, expected_status):
    """Test disease prediction API"""
    response = client.post("/predict-disease/", json={"symptoms": symptoms})
    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert "predicted_disease" in data
        assert isinstance(data["description"], str)
        assert isinstance(data["precautions"], list)
    else:
        assert "detail" in response.json()

def test_missing_symptoms_field():
    """Test API with missing symptoms field"""
    response = client.post("/predict-disease/", json={})
    assert response.status_code == 422

def test_sql_injection():
    """Test SQL injection attack"""
    response = client.post("/predict-disease/", json={"symptoms": ["cough'; DROP TABLE users;--"]})
    assert response.status_code == 400  # Should not allow SQL Injection

def test_script_injection():
    """Test script injection attack"""
    response = client.post("/predict-disease/", json={"symptoms": ["<script>alert('hacked')</script>"]})
    assert response.status_code == 400  # Should reject malicious input

def test_multiple_requests():
    """Test API performance under multiple requests"""
    for _ in range(100):
        response = client.post("/predict-disease/", json={"symptoms": ["fever", "headache"]})
        assert response.status_code == 200


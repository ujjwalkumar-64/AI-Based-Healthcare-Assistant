from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pickle
import pandas as pd
import os
import logging
from fastapi.middleware.cors import CORSMiddleware
import math

from logging.handlers import RotatingFileHandler

# Setup Logging
log_file_path = "/app/logs/app.log"

# Ensure logs directory exists
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

# Create a handler that will rotate the log files
handler = RotatingFileHandler(log_file_path, maxBytes=10*1024*1024, backupCount=5)  # 10MB per file

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        handler,
        logging.StreamHandler()  # This will also print logs to stdout
    ]
)

logger = logging.getLogger(__name__)


# Initialize FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific origins if needed
    allow_methods=["*"],
    allow_headers=["*"],
     allow_credentials=True,
)

# Load the trained model
try:
    model_path = os.path.join("models", "svc.pkl")
    with open(model_path, "rb") as file:
        model = pickle.load(file)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise RuntimeError(f"Error loading model: {e}")

# Load datasets
try:
    description = pd.read_csv(os.path.join("datasets", "description.csv"))
    precautions = pd.read_csv(os.path.join("datasets", "precautions_df.csv"))
    medications = pd.read_csv(os.path.join("datasets", "medications.csv"))
    diets = pd.read_csv(os.path.join("datasets", "diets.csv"))
    workout = pd.read_csv(os.path.join("datasets", "workout_df.csv"))
    logger.info("Datasets loaded successfully")
except FileNotFoundError as e:
    logger.error(f"Dataset file missing: {e}")
    raise RuntimeError(f"Dataset file missing: {e}")
except pd.errors.ParserError as e:
    logger.error(f"Error parsing dataset file: {e}")
    raise RuntimeError(f"Error parsing dataset file: {e}")
except Exception as e:
    logger.error(f"Unexpected error loading datasets: {e}")
    raise RuntimeError(f"Unexpected error loading datasets: {e}")

# Define a dictionary for symptom mapping
symptoms_dict = {
    'itching': 0, 'skin_rash': 1, 'nodal_skin_eruptions': 2, 'continuous_sneezing': 3, 'shivering': 4, 
    'chills': 5, 'joint_pain': 6, 'stomach_pain': 7, 'acidity': 8, 'ulcers_on_tongue': 9, 'muscle_wasting': 10, 
    'vomiting': 11, 'burning_micturition': 12, 'spotting_urination': 13, 'fatigue': 14, 'weight_gain': 15, 
    'anxiety': 16, 'cold_hands_and_feets': 17, 'mood_swings': 18, 'weight_loss': 19, 'restlessness': 20, 
    'lethargy': 21, 'patches_in_throat': 22, 'irregular_sugar_level': 23, 'cough': 24, 'high_fever': 25, 
    'sunken_eyes': 26, 'breathlessness': 27, 'sweating': 28, 'dehydration': 29, 'indigestion': 30, 'headache': 31, 
    'yellowish_skin': 32, 'dark_urine': 33, 'nausea': 34, 'loss_of_appetite': 35, 'pain_behind_the_eyes': 36, 
    'back_pain': 37, 'constipation': 38, 'abdominal_pain': 39, 'diarrhoea': 40, 'mild_fever': 41, 'yellow_urine': 42, 
    'yellowing_of_eyes': 43, 'acute_liver_failure': 44, 'fluid_overload': 45, 'swelling_of_stomach': 46, 
    'swelled_lymph_nodes': 47, 'malaise': 48, 'blurred_and_distorted_vision': 49, 'phlegm': 50, 'throat_irritation': 51, 
    'redness_of_eyes': 52, 'sinus_pressure': 53, 'runny_nose': 54, 'congestion': 55, 'chest_pain': 56, 
    'weakness_in_limbs': 57, 'fast_heart_rate': 58, 'pain_during_bowel_movements': 59, 'pain_in_anal_region': 60, 
    'bloody_stool': 61, 'irritation_in_anus': 62, 'neck_pain': 63, 'dizziness': 64, 'cramps': 65, 'bruising': 66, 
    'obesity': 67, 'swollen_legs': 68, 'swollen_blood_vessels': 69, 'puffy_face_and_eyes': 70, 'enlarged_thyroid': 71, 
    'brittle_nails': 72, 'swollen_extremeties': 73, 'excessive_hunger': 74, 'extra_marital_contacts': 75, 
    'drying_and_tingling_lips': 76, 'slurred_speech': 77, 'knee_pain': 78, 'hip_joint_pain': 79, 'muscle_weakness': 80, 
    'stiff_neck': 81, 'swelling_joints': 82, 'movement_stiffness': 83, 'spinning_movements': 84, 'loss_of_balance': 85, 
    'unsteadiness': 86, 'weakness_of_one_body_side': 87, 'loss_of_smell': 88, 'bladder_discomfort': 89, 
    'foul_smell_of_urine': 90, 'continuous_feel_of_urine': 91, 'passage_of_gases': 92, 'internal_itching': 93, 
    'toxic_look_(typhos)': 94, 'depression': 95, 'irritability': 96, 'muscle_pain': 97, 'altered_sensorium': 98, 
    'red_spots_over_body': 99, 'belly_pain': 100, 'abnormal_menstruation': 101, 'dischromic_patches': 102, 
    'watering_from_eyes': 103, 'increased_appetite': 104, 'polyuria': 105, 'family_history': 106, 'mucoid_sputum': 107, 
    'rusty_sputum': 108, 'lack_of_concentration': 109, 'visual_disturbances': 110, 'receiving_blood_transfusion': 111, 
    'receiving_unsterile_injections': 112, 'coma': 113, 'stomach_bleeding': 114, 'distention_of_abdomen': 115, 
    'history_of_alcohol_consumption': 116, 'fluid_overload_1': 117, 'blood_in_sputum': 118, 'prominent_veins_on_calf': 119, 
    'palpitations': 120, 'painful_walking': 121, 'pus_filled_pimples': 122, 'blackheads': 123, 'scurring': 124, 
    'skin_peeling': 125, 'silver_like_dusting': 126, 'small_dents_in_nails': 127, 'inflammatory_nails': 128, 
    'blister': 129, 'red_sore_around_nose': 130, 'yellow_crust_ooze': 131
}

diseases_list = {
    15: 'Fungal infection', 4: 'Allergy', 16: 'GERD', 9: 'Chronic cholestasis', 14: 'Drug Reaction', 
    33: 'Peptic ulcer disease', 1: 'AIDS', 12: 'Diabetes', 17: 'Gastroenteritis', 6: 'Bronchial Asthma', 
    23: 'Hypertension', 30: 'Migraine', 7: 'Cervical spondylosis', 32: 'Paralysis (brain hemorrhage)', 
    28: 'Jaundice', 29: 'Malaria', 8: 'Chicken pox', 11: 'Dengue', 37: 'Typhoid', 40: 'Hepatitis A', 
    19: 'Hepatitis B', 20: 'Hepatitis C', 21: 'Hepatitis D', 22: 'Hepatitis E', 3: 'Alcoholic hepatitis', 
    36: 'Tuberculosis', 10: 'Common Cold', 34: 'Pneumonia', 13: 'Dimorphic hemorrhoids (piles)', 
    18: 'Heart attack', 39: 'Varicose veins', 26: 'Hypothyroidism', 24: 'Hyperthyroidism', 25: 'Hypoglycemia', 
    31: 'Osteoarthritis', 5: 'Arthritis', 0: 'Vertigo (Benign Paroxysmal Positional Vertigo)', 2: 'Acne', 
    38: 'Urinary tract infection', 35: 'Psoriasis', 27: 'Impetigo'
}

class SymptomsRequest(BaseModel):
    symptoms: List[str]


def get_predicted_value(patient_symptoms: List[str]) -> str:
    # If no symptoms are provided or the list is empty, return an error message
    if not patient_symptoms:
        return "Invalid symptoms provided"
    
    try:
        # Initialize the input vector with zeros
        input_vector = [0] * len(symptoms_dict)
        unknown_symptoms = False

        # Process the symptoms and update the vector
        for symptom in patient_symptoms:
            if symptom in symptoms_dict:
                input_vector[symptoms_dict[symptom]] = 1
            else:
                logger.warning(f"Unknown symptom: {symptom}")
                unknown_symptoms = True

        # If there are unknown symptoms, return the error message
        if unknown_symptoms:
            return "Invalid symptoms provided"

        # Otherwise, make the prediction using the model
        predicted_disease = model.predict([input_vector])[0]
        
        # Map the predicted index to a disease name
        disease_name = diseases_list.get(predicted_disease, "Invalid symptoms provided")
        return disease_name

    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

def clean_list(lst):
    return [x if isinstance(x, str) else str(x) if x is not None and not (isinstance(x, float) and (math.isnan(x) or math.isinf(x))) else "Data not available" for x in lst]

def helper(predicted_disease):
    try:
        # Retrieve description
        desc_series = description[description['Disease'] == predicted_disease]['Description']
        desc = desc_series.values[0] if not desc_series.empty else "Consult a healthcare provider for more information"

        # Retrieve precautions
        pre_df = precautions[precautions['Disease'] == predicted_disease][['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']]
        pre = pre_df.values.flatten().tolist() if not pre_df.empty else ["Consult a healthcare provider for precautions"]
        pre = clean_list(pre)

        # Retrieve medications
        med_series = medications[medications['Disease'] == predicted_disease]['Medication']
        med = [med.strip("[]").replace("'", "").split(", ") for med in med_series.values] if not med_series.empty else [["Consult a healthcare provider for medications"]]
        med = clean_list(med[0] if med else ["Consult a healthcare provider for medications"])

        # Retrieve diet recommendations
        die_series = diets[diets['Disease'] == predicted_disease]['Diet']
        die = [die.strip("[]").replace("'", "").split(", ") for die in die_series.values] if not die_series.empty else [["Consult a healthcare provider for diet recommendations"]]
        die = clean_list(die[0] if die else ["Consult a healthcare provider for diet recommendations"])

        # Retrieve workout recommendations
        wrkout_series = workout[workout['disease'] == predicted_disease]['workout']
        wrkout = wrkout_series.values.tolist() if not wrkout_series.empty else ["Consult a healthcare provider for workout recommendations"]
        wrkout = clean_list(wrkout)

        logger.info(f"Retrieved information for disease: {predicted_disease}")
        return (desc, pre, med, die, wrkout)

    except Exception as e:
        logger.error(f"Error retrieving information for {predicted_disease}: {e}")
        return (
            "Description not available",
            ["No precautions available"],
            ["No medications available"],
            ["No diet recommendations available"],
            ["No workout recommendations available"]
        )

@app.post("/predict-disease/")
def predict_disease(request: SymptomsRequest):
    try:
        logger.info(f"Received symptoms: {request.symptoms}")
        
        user_symptoms = [s.strip().lower() for s in request.symptoms if s.strip() in symptoms_dict]
        
        if not user_symptoms:
            raise HTTPException(status_code=400, detail="Invalid symptoms provided")
        
        predicted_disease = get_predicted_value(user_symptoms)
        desc, pre, med, die, wrkout = helper(predicted_disease)

        return {
            "predicted_disease": predicted_disease,
            "description": desc,
            "precautions": pre,
            "medications": med,
            "workout": wrkout,
            "diets": die
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@app.get("/")
def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the Disease Prediction API!"}

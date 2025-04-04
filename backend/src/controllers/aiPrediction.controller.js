import { AiPrediction } from "../models/aiPrediction.model.js";
import axios from "axios";
import mongoose from "mongoose";
import { Patient } from "../models/patient.model.js";

const createAiPrediction = async (req, res) => {
    try {
        const {symptoms} = req.body;
        if (!symptoms) {       
            return res.status(400).json({ message: "Symptoms are required" });
        }
        const response = await axios.post("http://fastapi:8000/predict-disease", {symptoms} ,{
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status !== 200) {
            return res.status(response.status).json({ message: "Failed to fetch prediction from AI service" });
        }

        const { predicted_disease, description, precautions, medications, workout, diets } = response.data;

        if (!predicted_disease || !description || !precautions || !medications || !workout || !diets) { 
            return res.status(400).json({ message: "Invalid response from AI service" });
        }
         
 
        const aiPrediction = new AiPrediction({
            userId: req.user?._id,
            predicted_disease,
            description,
            precautions,
            medications,
            workout,
            diets,
        });

           
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        if (!patient.aiPredictions.includes(aiPrediction._id)) {
            patient.aiPredictions.push(aiPrediction._id);
            await patient.save();
        }

        await aiPrediction.save();
        

        res.status(201).json({ message: "AI Prediction created successfully",data: aiPrediction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
const getAllAiPredictions = async (req, res) => {
    try {
        const aiPredictions = await AiPrediction.find().populate("userId", "fullName email");
        res.status(200).json({message:"all predictions fetch successfully.",data:aiPredictions});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAiPredictionById = async (req, res) => {
    try {
        const{id} = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        const aiPrediction = await AiPrediction.findById(id).populate("userId", "fullName email");
        
        if (!aiPrediction) {
            return res.status(404).json({ message: "AI Prediction not found" });
        }

        res.status(200).json({message:"prediction fetch successfully.",data:aiPrediction});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const deleteAiPrediction = async (req, res) => {
    try {
        const{id} = req.params;
        if (!id) {
            return res.status(400).json({ message: "ID is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const aiPrediction = await AiPrediction.findById(req.params.id);
        if (!aiPrediction) {
            return res.status(404).json({ message: "AI Prediction not found" });
        }

        await AiPrediction.findByIdAndDelete(id);
       
        const patient = await Patient.findOne({ userId: aiPrediction.userId });

        if (patient) {
            patient.aiPredictions = patient.aiPredictions.filter(
                predictionId => predictionId.toString() !== id
            );
            await patient.save();
        }
    
        res.status(200).json({ message: "AI Prediction deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    createAiPrediction,
    getAllAiPredictions,
    getAiPredictionById,
    deleteAiPrediction,

}
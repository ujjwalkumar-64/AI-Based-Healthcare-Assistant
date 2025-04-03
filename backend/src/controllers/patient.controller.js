import mongoose from 'mongoose';
import { Patient } from "../models/patient.model.js";
import { Address } from "../models/address.model.js";


 const registerPatient = async (req, res) => {
    try {
        const {  medicalHistory, allergies, emergencyContact, address, currentMedications } = req.body;

        const user = req.user;
        if (!user ) {
            return res.status(400).json({ message: "Invalid user" });
        }

        let addressId = null;
        if (address) {
            const newAddress = await Address.create(address);
            if(!newAddress){
                return res.status(400).json({ message: "Invalid address." });
            }
            addressId = newAddress._id;
        }

        const patient = new Patient({
            userId:user._id,
            medicalHistory,
            allergies,
            emergencyContact,
            address: addressId,
            currentMedications,
        });
        const newPatient = await patient.save();
        if(!newPatient){
            return res.status(400).json({ message: "Invalid patient details." });
        }

        res.status(201).json({ message: "Patient registered successfully.", patient: newPatient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid patient ID." });
        }
        const patient = await Patient.findById(id)
            .populate("userId", "fullName email phone dob gender role")
            .populate("address")
            .populate("appointments")
            .populate("aiPredictions");

        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        if ( req.user._id.toString() !== patient.userId.toString() && req.user.role!=="admin") {
            return res.status(403).json({ message: "Unauthorized to view this profile." });
        }

        res.status(200).json({message:"Patient detail fetch successfully: ",data:patient});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


 const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Patient ID." });
        }
        const { medicalHistory, allergies, emergencyContact, address, currentMedications } = req.body;

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

         
        if ( req.user._id.toString() !== patient.userId.toString() && req.user.role!=="admin") {
            return res.status(403).json({ message: "Unauthorized to update this profile." });
        }
 

        if (address) {
            if (patient.address) {
                await Address.findByIdAndUpdate(patient.address, address);
            } else {
                const newAddress = await Address.create(address);
                patient.address = newAddress._id;
            }
        }

        const fieldsToUpdate = { medicalHistory, allergies, emergencyContact, currentMedications };
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (value !== undefined) patient[key] = value;
        }

        await patient.save();
        res.status(200).json({ message: "Patient profile updated successfully.", data:patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }
        if (!patient.address) {
            return res.status(404).json({ message: "Patient address not found." });
        }

        await Patient.findByIdAndDelete(id);

        const deletedAddress = await Address.findByIdAndDelete(patient.address);
        if (!deletedAddress) {
            return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
        }
        res.status(200).json({ message: "Patient profile deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().populate("userId", "name email").populate("appointments");
        if (!patients || patients.length === 0) {
            return res.status(404).json({ message: "No patients found" });
        }
        res.status(200).json({message:"list of all patients fetch successfully: ", data : patients});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
   registerPatient,
   getPatient,
   updatePatient,
   deletePatient,
   getAllPatients

}
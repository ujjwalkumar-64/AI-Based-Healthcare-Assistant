import mongoose from 'mongoose';
import { Patient } from "../models/patient.model.js";
import { Address } from "../models/address.model.js";
import { Doctor } from '../models/doctor.model.js';
import { Appointment } from '../models/appointment.model.js';

 const registerPatient = async (req, res) => {
    try {
        const {  medicalHistory, allergies, emergencyContact, address, currentMedications } = req.body;


        const user = req.user; 

        const existingPatient = await Patient.findOne({ userId: user._id });
        if (existingPatient) {
            return res.status(400).json({ message: "Patient is already registered." });
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Patient ID." });
        }

        const { medicalHistory, allergies, emergencyContact, address, currentMedications } = req.body;

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        // Authorization check
        if (req.user._id.toString() !== patient.userId.toString() && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized to update this profile." });
        }

        if (address) {
            if (patient.address) {
                const updatedAddress = await Address.findByIdAndUpdate(patient.address, address, { new: true });
                if (!updatedAddress) {
                    return res.status(400).json({ message: "Failed to update address." });
                }
            } else {
                const newAddress = await Address.create(address);
                if (!newAddress) {
                    return res.status(400).json({ message: "Failed to create new address." });
                }
                patient.address = newAddress._id;
            }
        }

        // Emergency Contact Validation
        if (emergencyContact) {
            const { name, relation, phone } = emergencyContact;
            if (!name || !relation || !phone) {
                return res.status(400).json({ message: "Emergency contact must include name, relation, and phone." });
            }

            patient.emergencyContact = emergencyContact;
        }

        const fieldsToUpdate = { medicalHistory, allergies, currentMedications };
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (value !== undefined) patient[key] = value;
        }

        const updatedPatient = await patient.save();

        res.status(200).json({
            message: "Patient profile updated successfully.",
            data: updatedPatient,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;  
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Patient ID." });
        }

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        // Check if patient has an associated address
        if (patient.address) {
            const deletedAddress = await Address.findByIdAndDelete(patient.address);
            if (!deletedAddress) {
                return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
            }
        }

        // Delete associated appointments
        if (patient.appointments.length > 0) {
            const appointmentIds = patient.appointments.map(app => app.toString());
            await Appointment.deleteMany({ _id: { $in: appointmentIds } });

            // Remove appointments from associated doctor's list
            const doctorsWithAppointments = await Doctor.find({
                appointments: { $in: appointmentIds },
            });

            for (const doctor of doctorsWithAppointments) {
                doctor.appointments = doctor.appointments.filter(
                    appId => !appointmentIds.includes(appId.toString())
                );
                await doctor.save();
            }
        }

        // Remove patient from all doctors' `patients` lists
        const doctorsWithPatient = await Doctor.find({ patients: id });
        for (const doctor of doctorsWithPatient) {
            doctor.patients = doctor.patients.filter(p => p.toString() !== id);
            await doctor.save();
        }

        // remove patient from all hospital patient list
        const hospitalsWithPatient = await Hospital.find({ patients: id });
        for (const hospital of hospitalsWithPatient) {
            hospital.patients = hospital.patients.filter(p => p.toString() !== id);
            await hospital.save();
        }
        await Patient.findByIdAndDelete(id);

        res.status(200).json({
            message: "Patient profile, address (if any), appointments (if any), and associations with doctors successfully deleted."
        });
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
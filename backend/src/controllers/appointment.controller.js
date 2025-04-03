import { Appointment } from "../models/appointment.model.js";
import { Patient } from "../models/patient.model.js";
import { Doctor } from "../models/doctor.model.js";
import {Hospital} from "../models/hospital.model.js";
import mongoose from 'mongoose';


 const createAppointment = async (req, res) => {
    try {
        const { doctorId, hospitalId, appointmentDate, notes } = req.body;
        const user = req.user; 
        const userId =user._id;
        const validIds = { doctorId, hospitalId, userId };
        for (const [key, value] of Object.entries(validIds)) {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return res.status(400).json({ message: `Invalid ${key}.` });
            }
        }
        
      
        const patient = await Patient.findOne({ userId });
        if (!patient) return res.status(404).json({ message: "Patient profile not found." });

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found." });

        const hospital = await Hospital.findById(hospitalId)
        if(!hospital) return res.status(404).json({ message: "Hospital not found." });

        if (doctor.hospitalAffiliation !== hospital.name) {
            return res.status(400).json({ message: "Doctor does not belong to the selected hospital" });
        }
 
        const newAppointment = await Appointment.create({
            patientId: patient._id,
            userId,
            doctorId,
            hospitalId,
            appointmentDate,
            notes
        });

        patient.appointments.push(newAppointment._id);
        await patient.save();
 

        res.status(201).json({ message: "Appointment created successfully.", data: newAppointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate({
                path:"patientId", 
                select:"medicalHistory allergies aipredictions emergencyContact currentMedications",
                populate:{
                    path:"userId",
                    select:"fullName dob gender"
                },
            })
            .populate({
                path: "doctorId",
                select: "specialization experienceYears hospitalAffiliation",
                populate:{
                    path: "userId",  
                    select: "fullName email",  
                }
                
            })
            .populate("hospitalId", "name contact address");

        res.status(200).json({message:"All appointments fetch successfully",data:appointments});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user._id;  

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: `Invalid userId.` });
        }

        const patient = await Patient.findOne({ userId });
        if (patient) {
            const patientAppointments = await Appointment.find({ patientId: patient._id })
            .populate({
                path:"patientId", 
                select:"medicalHistory allergies aipredictions emergencyContact currentMedications",
                populate:{
                    path:"userId",
                    select:"fullName dob gender"
                },
            })
            .populate({
                path: "doctorId",
                select: "specialization experienceYears hospitalAffiliation",
                populate: {
                    path: "userId",  
                    select: "fullName email",  
                },
            })
            .populate("hospitalId", "name contact address");

            return res.status(200).json({message:"all Patient's appointment fetch successfully.",data:patientAppointments});
        }

         
        const doctor = await Doctor.findOne({ userId });
        if (doctor) {
            const doctorAppointments = await Appointment.find({ doctorId: doctor._id })
            .populate({
                path:"patientId", 
                select:"medicalHistory allergies aipredictions emergencyContact currentMedications",
                populate:{
                    path:"userId",
                    select:"fullName dob gender"
                },
            })
            .populate({
                path: "doctorId",
                select: "specialization experienceYears hospitalAffiliation",
                populate: {
                    path: "userId",  
                    select: "fullName email",  
                },
            })
            .populate("hospitalId", "name contact address");
            return res.status(200).json({message:"all doctor's appointment  fetch succesfully.",data:doctorAppointments});
        }

         
        return res.status(403).json({ message: "Access denied. Only patients and doctors can view appointments." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


 
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: `Invalid appointment id.` });
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: "Appointment not found." });

        appointment.status = status;
        await appointment.save();

        res.status(200).json({ message: "Appointment status updated.", appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found." });

        await Patient.findOneAndUpdate(
            { _id: appointment.patientId },
            { $pull: { appointments: appointment._id } }
        );

        await appointment.deleteOne();
        res.status(200).json({ message: "Appointment deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    updateAppointmentStatus,
    deleteAppointment
}
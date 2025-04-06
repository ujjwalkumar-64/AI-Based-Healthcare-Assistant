import mongoose from 'mongoose';
import { Doctor } from "../models/doctor.model.js";
import { Address } from "../models/address.model.js";
import { Hospital } from '../models/hospital.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Department } from '../models/department.model.js';
import { Patient } from '../models/patient.model.js';

const registerDoctor = async (req, res) => {
    try {
        const { specialization, medicalLicense, experienceYears, hospitalId , availability, address } = req.body;
        const userId = req.user._id; 

        const existingDoctor = await Doctor.findOne({ userId });
        if (existingDoctor) {
            return res.status(400).json({ message: "Doctor is already registered." });
        }

        let addressId = null;
        if (address) {
            const newAddress = await Address.create(address);
            if(!newAddress){
                return res.status(400).json({ message: "Invalid address." });
            }
            addressId = newAddress._id;
        }

                 
        let hospital = null;
        if (hospitalId) {
            hospital = await Hospital.findById(hospitalId);
            if (!hospital) {
                return res.status(404).json({ message: "Hospital not found" });
            }
        }

                
        const doctor = new Doctor({
            userId,
            specialization,
            medicalLicense,
            experienceYears,
            hospitalAffiliation: hospital ? hospital.name : null,
            availability,
            address: addressId,
        });

      
           const newDoctor = await doctor.save();
           // If the doctor is a department head, update the hospital model
           if (hospital) {
               hospital.doctors.push(newDoctor._id);
   
               // Check if doctor is assigned as a department head
               hospital.departments.forEach((department) => {
                   if (department.headDoctor.toString() === newDoctor._id.toString()) {
                        newDoctor.hospitalAffiliation = hospital.name;
                   }
               });
   
               await hospital.save();
               await newDoctor.save();
           }

     

        res.status(201).json({message: "Doctor registered successfully",data:newDoctor});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
  const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
                            .populate("userId" ,"-password -_id")
                            .populate("address" , "-_id");

        res.status(200).json({message:"Doctors list fetch successfully. ",data:doctors});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
const getDoctorById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid doctor ID." });
        }
        const doctor = await Doctor.findById(req.params.id)
                            .populate("userId","-password -_id")
                            .populate("address","-_id");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        res.status(200).json({message:" Doctor Details fetch successfully",data:doctor});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
const getMyDoctorProfile = async (req, res) => {
    try {
        const userId = req.user._id
        const doctor = await Doctor.findOne({  userId })
                        .populate("userId","-password -_id")
                        .populate("address","-_id");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyPatientList = async (req, res) => {
    try {   
        const userId = req.user._id;

        
        const doctor = await Doctor.findOne({userId}).populate("patients");
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }
        if (doctor.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to view" });
        }
        const patients = doctor.patients;
        if (!patients || patients.length === 0) {
            return res.status(404).json({ message: "No patients found for this doctor" });
        }
        res.status(200).json({ message: "Patients list fetched successfully", data: patients });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

  const updateDoctor = async (req, res) => {
    try {
        const { specialization, medicalLicense, experienceYears, availability, address,rating } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid doctor ID." });
        }

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (doctor.userId.toString() !== req.user._id.toString() && req.user.role!== "admin") {
            return res.status(403).json({ message: "Not authorized to update this profile" });
        }
 
        if(address){
            if(doctor.address) {
               const newAddress = await Address.findByIdAndUpdate(doctor.address,address)
               if(!newAddress) return res.status(400).json({ message: "Invalid address." });
               
            }else{
                const newAddress =await Address.create(address)
                if(!newAddress) return res.status(400).json({ message: "Invalid address." });
                doctor.address = newAddress._id;
            } 
        }

        const fieldsToUpdate = { specialization, medicalLicense, experienceYears, availability };
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (value !== undefined) doctor[key] = value;
        }

        if(rating !== undefined){

            if ( req.user.role ==="admin") {
                if (typeof rating !== "number" || rating < 0 || rating > 5 ) {
                    return res.status(400).json({ message: "Invalid rating value." });
                }
                doctor.rating = rating;
            }else{
            return res.status(403).json({ message: "Not authorized to update rating" });
        }
        }
        

        const updatedDoctor = await doctor.save();
        res.status(200).json({message:"Doctor Details updated successfully.",data:updatedDoctor});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params; 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid doctor ID." });
        }

        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found." });
        }


        // Check and delete associated address (if exists)
        if (doctor.address) {
            const deletedAddress = await Address.findByIdAndDelete(doctor.address);
            if (!deletedAddress) {
                return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
            }
        }

        // Remove doctor's appointments
        if (doctor.appointments.length > 0) {
            const appointmentIds = doctor.appointments.map(app => app.toString());
            
            // Remove appointments from patients' lists
            const patientsWithAppointments = await Patient.find({ appointments: { $in: appointmentIds } });
            for (const patient of patientsWithAppointments) {
                patient.appointments = patient.appointments.filter(appId => !appointmentIds.includes(appId.toString()));
                await patient.save();
            }

            // Delete the appointments
            await Appointment.deleteMany({ _id: { $in: appointmentIds } });
        }

        // Remove doctor from departments
        const departments = await Department.find({ doctors: id });
        for (const department of departments) {
            department.doctors = department.doctors.filter(docId => docId.toString() !== id);
            if (department.headDoctor.toString() === id) {
                department.headDoctor = undefined; // Clear headDoctor if this doctor is the head
            }
            await department.save();
        }

        // Remove doctor from hospitals
        const hospitals = await Hospital.find({ doctors: id });
        for (const hospital of hospitals) {
            hospital.doctors = hospital.doctors.filter(docId => docId.toString() !== id);
            await hospital.save();
        }

        // Delete the doctor
        await Doctor.findByIdAndDelete(id);


        res.status(200).json({
            message: "Doctor, associated address, appointments, references in hospitals, departments, and patients successfully deleted."
        });
    } catch (error) {

        res.status(500).json({ message: error.message });
    }
};




export {
    registerDoctor,
    getAllDoctors,
    getDoctorById,
    getMyDoctorProfile,
    updateDoctor,
    deleteDoctor,
    getMyPatientList
}
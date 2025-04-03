import mongoose from 'mongoose';
import { Doctor } from "../models/doctor.model.js";
import { Address } from "../models/address.model.js";
import { Hospital } from '../models/hospital.model.js';

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
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid doctor ID." });
        }

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

 
        if (doctor.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this profile" });
        }

        if (!doctor.address) {
            return res.status(404).json({ message: "doctor address not found." });
        }


        await Doctor.findByIdAndDelete(id);
        
         const deletedAddress = await Address.findByIdAndDelete(doctor.address);
         if (!deletedAddress) {
             return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
         }

        res.status(200).json({ message: "Doctor deleted successfully" });
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
    deleteDoctor
}
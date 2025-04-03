import { Hospital } from "../models/hospital.model.js";
import { Address } from "../models/address.model.js";
import { Doctor } from "../models/doctor.model.js";
import mongoose from 'mongoose';

  const createHospital = async (req, res) => {
    try {
        const { name, type, contact, address,  departments } = req.body;

       
        const existingHospital = await Hospital.findOne({ name });
        if (existingHospital) {
            return res.status(400).json({ message: "Hospital with this name already exists" });
        }

        let addressId = null;
        if(address){
            const newAddress = await Address.create(address);
            if(!newAddress){
                return res.status(400).json({ message: "Invalid address." });
            }
            addressId= newAddress._id;
        }
        
        const hospital = new Hospital({ 
                            name, 
                            type,
                            contact, 
                            doctors:[], 
                            departments:[],
                            address:addressId
        });

        
        for (let dept of departments) {
            const doctor = await Doctor.findById(dept.headDoctor);

            if (!doctor) {
                return res.status(404).json({ message: `Doctor with ID ${dept.headDoctor} not found` });
            }

            hospital.departments.push({
                name: dept.name,
                headDoctor: doctor._id,
            });

            doctor.hospitalAffiliation = hospital.name;

            hospital.doctors.push(doctor._id);
            await doctor.save();  
        }



        await hospital.save();

        res.status(201).json({ message: "Hospital created successfully",data: hospital });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find()
        .populate("address", "street city state country postalCode")
        .populate({
            path: "doctors",
            select: "specialization experienceYears",
            populate: {
                path: "userId",  
                select: "fullName email",  
            },
        })
        .populate({
            path: "departments.headDoctor",
            select: "specialization",
            populate: {
                path: "userId",
                select: "fullName email ",  
            },
        });

        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getHospitalById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }
        const hospital = await Hospital.findById(req.params.id)
            .populate("address", "street city state country postalCode")
            .populate({
                path: "doctors",
                select: "specialization experienceYears",
                populate: {
                    path: "userId",  
                    select: "fullName email",  
                },
            })
            .populate({
                path: "departments.headDoctor",
                select: "specialization",
                populate: {
                    path: "userId",
                    select: "fullName email",  
                },
            });
 

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        res.status(200).json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
const updateHospital = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }
        const {contact, address,  departments} = req.body;
        
        const hospital= await Hospital.findById(req.params.id)

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }
        if(address){
            if(hospital.address) {
               const newAddress = await Address.findByIdAndUpdate(hospital.address,address)
               if(!newAddress) return res.status(400).json({ message: "Invalid address." });
               
            }else{
                const newAddress =await Address.create(address)
                if(!newAddress) return res.status(400).json({ message: "Invalid address." });
                hospital.address = newAddress._id;
            } 
        }

        const fieldsToUpdate = { contact, departments };
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
            if (value !== undefined) hospital[key] = value;
        }

        const updatedHospital = await hospital.save();

        res.status(200).json({ message: "Hospital updated successfully", updatedHospital });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

 
 const deleteHospital = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }
        const {id} = req.params;
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        await Hospital.findByIdAndDelete(id);
        
        const deletedAddress = await Address.findByIdAndDelete(hospital.address);
        if (!deletedAddress) {
            return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
        }

        res.status(200).json({ message: "Hospital deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export   {
    createHospital,
    getAllHospitals,
    getHospitalById,
    updateHospital,
    deleteHospital
}
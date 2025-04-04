import { Hospital } from "../models/hospital.model.js";
import { Address } from "../models/address.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Department } from "../models/department.model.js";
import mongoose from 'mongoose';

  const createHospital = async (req, res) => {
    try {
        const { name, type, contact, address, departments } = req.body;

        const existingHospital = await Hospital.findOne({ name });
        if (existingHospital) {
            return res.status(400).json({ message: "Hospital with this name already exists" });
        }

        let addressId = null;
        if (address) {
            const newAddress = await Address.create(address);
            addressId = newAddress._id;
        }

        const hospital = await Hospital.create({
            name,
            type,
            contact,
            address: addressId,
            doctors: [],
            departments: []
        });

        const allDoctorIds = new Set();
        const departmentIds = [];

        for (let dept of departments) {
            const deptName = dept.name.toLowerCase().trim();

            const headDoctor = await Doctor.findById(dept.headDoctor);
            if (!headDoctor) {
                return res.status(404).json({ message: `Head doctor with ID ${dept.headDoctor} not found` });
            }

            const deptDoctorIds = [];
            for (const docId of dept.doctors || []) {
                const doc = await Doctor.findById(docId);
                if (!doc) {
                    return res.status(404).json({ message: `Doctor with ID ${docId} not found` });
                }
                deptDoctorIds.push(doc._id);
                allDoctorIds.add(doc._id.toString());

                doc.hospitalAffiliation = hospital.name;
                await doc.save();
            }

            if (!deptDoctorIds.includes(headDoctor._id.toString())) {
                deptDoctorIds.push(headDoctor._id);
                allDoctorIds.add(headDoctor._id.toString());
            }

            const newDepartment = await Department.create({
                name: deptName,
                headDoctor: headDoctor._id,
                doctors: deptDoctorIds,
                hospital: hospital._id
            });

            departmentIds.push(newDepartment._id);
        }

        hospital.departments = departmentIds;
        hospital.doctors = Array.from(allDoctorIds);
        await hospital.save();

        return res.status(201).json({
            message: "Hospital created successfully",
            data: hospital
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
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
                path: "departments",
                select: "name headDoctor doctors",
                populate: [
                    {
                        path: "headDoctor",
                        select: "specialization experienceYears",
                        populate: {
                            path: "userId",
                            select: "fullName email",
                        }
                    },
                    {
                        path: "doctors",
                        select: "specialization experienceYears",
                        populate: {
                            path: "userId",
                            select: "fullName email",
                        }
                    }
                ]
            });

        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getHospitalById = async (req, res) => {
    try {
        const hospitalId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }

        const hospital = await Hospital.findById(hospitalId)
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
                path: "departments",
                populate: [
                    {
                        path: "headDoctor",
                        select: "specialization",
                        populate: {
                            path: "userId",
                            select: "fullName email",
                        },
                    },
                    {
                        path: "doctors",
                        select: "specialization",
                        populate: {
                            path: "userId",
                            select: "fullName email",
                        },
                    }
                ]
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
        const hospitalId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }

        const { contact, address, departments } = req.body;

        const hospital = await Hospital.findById(hospitalId);

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

 
        if (address) {
            if (hospital.address) {
                const updatedAddress = await Address.findByIdAndUpdate(hospital.address, address, { new: true });
                if (!updatedAddress) {
                    return res.status(400).json({ message: "Invalid address update." });
                }
            } else {
                const newAddress = await Address.create(address);
                if (!newAddress) {
                    return res.status(400).json({ message: "Invalid address." });
                }
                hospital.address = newAddress._id;
            }
        }

        
        if (contact) {
            hospital.contact = contact;
        }

        if (departments !== undefined) {
            const newDepartmentIds = [];

            for (const dept of departments) {
                const deptName = dept.name.toLowerCase().trim();

                const headDoctor = await Doctor.findById(dept.headDoctor);
                if (!headDoctor) {
                    return res.status(404).json({ message: `Head doctor with ID ${dept.headDoctor} not found` });
                }

                const deptDoctorIds = [];
                for (const docId of dept.doctors || []) {
                    const doc = await Doctor.findById(docId);
                    if (!doc) {
                        return res.status(404).json({ message: `Doctor with ID ${docId} not found` });
                    }
                    deptDoctorIds.push(doc._id);
                }

                if (!deptDoctorIds.includes(headDoctor._id)) {
                    deptDoctorIds.push(headDoctor._id);
                }

                const newDept = await Department.create({
                    name: deptName,
                    headDoctor: headDoctor._id,
                    doctors: deptDoctorIds,
                    hospital: hospital._id
                });

                newDepartmentIds.push(newDept._id);
            }

            hospital.departments = newDepartmentIds;
        }

        const updatedHospital = await hospital.save();

        res.status(200).json({
            message: "Hospital updated successfully",
            data: updatedHospital
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


 
const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Hospital ID." });
        }

        const hospital = await Hospital.findById(id).populate("departments");
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        if (hospital.departments && hospital.departments.length > 0) {
            for (const dept of hospital.departments) {
                await Department.findByIdAndDelete(dept._id);
            }
        }

        if (hospital.doctors && hospital.doctors.length > 0) {
            await Doctor.updateMany(
                { _id: { $in: hospital.doctors } },
                { $unset: { hospitalAffiliation: "" } }
            );
        }

        await Hospital.findByIdAndDelete(id);

        if (hospital.address) {
            await Address.findByIdAndDelete(hospital.address);
        }

        res.status(200).json({ message: "Hospital and associated data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export   {
    createHospital,
    getAllHospitals,
    getHospitalById,
    updateHospital,
    deleteHospital,
}
import { Hospital } from "../models/hospital.model.js";
import { Address } from "../models/address.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Department } from "../models/department.model.js";
import {Appointment} from "../models/appointment.model.js";
import { Patient } from "../models/patient.model.js";
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
            return res.status(404).json({ message: "Hospital not found." });
        }

        if (address) {
            if (hospital.address) {
                const updatedAddress = await Address.findByIdAndUpdate(hospital.address, address, { new: true });
                if (!updatedAddress) {
                    return res.status(400).json({ message: "Address update failed." });
                }
            } else {
                const newAddress = await Address.create(address);
                hospital.address = newAddress._id;
            }
        }

        if (contact) {
            hospital.contact = contact;
        }

        if (departments && Array.isArray(departments)) {
            const newDepartmentIds = [];

            for (const dept of departments) {
                const deptName = dept.name?.toLowerCase()?.trim();
                if (!deptName) {
                    return res.status(400).json({ message: "Department name is required." });
                }

                const headDoctor = await Doctor.findById(dept.headDoctor);
                if (!headDoctor) {
                    return res.status(404).json({ message: `Head doctor with ID ${dept.headDoctor} not found.` });
                }

                const deptDoctorIds = [];
                for (const docId of dept.doctors || []) {
                    const doctor = await Doctor.findById(docId);
                    if (!doctor) {
                        return res.status(404).json({ message: `Doctor with ID ${docId} not found.` });
                    }
                    deptDoctorIds.push(doctor._id);
                }

                if (!deptDoctorIds.includes(headDoctor._id)) {
                    deptDoctorIds.push(headDoctor._id); 
                }

                // Create the department
                const newDept = await Department.create({
                    name: deptName,
                    headDoctor: headDoctor._id,
                    doctors: deptDoctorIds,
                    hospital: hospital._id,
                });

                newDepartmentIds.push(newDept._id);
            }

            hospital.departments = newDepartmentIds;
        }

        const updatedHospital = await hospital.save();

        res.status(200).json({
            message: "Hospital updated successfully.",
            data: updatedHospital,
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

        const hospital = await Hospital.findById(id);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found." });
        }

        // Delete associated departments in batch
        if (hospital.departments && hospital.departments.length > 0) {
            await Department.deleteMany({ _id: { $in: hospital.departments } });
        }

        // Delete associated appointments and clean up references
        const associatedAppointments = await Appointment.find({ hospitalId: id });
        if (associatedAppointments.length > 0) {
            const appointmentIds = associatedAppointments.map(app => app._id.toString());

            // Remove appointments from associated patients in batch
            await Patient.updateMany(
                { appointments: { $in: appointmentIds } },  
                { $pull: { appointments: { $in: appointmentIds } } }  
            );

            // Remove appointments from associated doctors in batch
            await Doctor.updateMany(
                { appointments: { $in: appointmentIds } },  
                { $pull: { appointments: { $in: appointmentIds } } }  
            );

            // Delete the appointments
            await Appointment.deleteMany({ hospitalId: id });
        }

        // Remove hospital reference from associated doctors
        if (hospital.doctors && hospital.doctors.length > 0) {
            await Doctor.updateMany(
                { _id: { $in: hospital.doctors } },
                { $unset: { hospitalAffiliation: "" } }
            );
        }

        // Remove hospital reference from associated patients
        if (hospital.patients && hospital.patients.length > 0) {
            await Patient.updateMany(
                { _id: { $in: hospital.patients } },
                { $unset: { hospitalId: "" } }
            );
        }

        // Check and delete the hospital's address 
        if (hospital.address) {
            await Address.findByIdAndDelete(hospital.address);
        }

        await Hospital.findByIdAndDelete(id);

        res.status(200).json({
            message: "Hospital, associated departments, address, appointments, and references in doctors and patients successfully deleted."
        });
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
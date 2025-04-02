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

        const newPatient = await Patient.create({
            userId:user._id,
            medicalHistory,
            allergies,
            emergencyContact,
            address: addressId,
            currentMedications,
        });

        res.status(201).json({ message: "Patient registered successfully.", patient: newPatient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

  const getPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id)
            .populate("userId", "fullName email phone dob gender role")
            .populate("address")
            .populate("appointments")
            .populate("aiPredictions");

        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        res.status(200).json({message:"Patient detail fetch successfully: ",data:patient});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


 const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicalHistory, allergies, emergencyContact, address, currentMedications } = req.body;

        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

         
        if ( req.user._id.toString() !== patient.userId.toString() && req.user.role!=="admin") {
            return res.status(403).json({ message: "Unauthorized to update this profile." });
        }

        if (medicalHistory) patient.medicalHistory = medicalHistory;
        if (allergies) patient.allergies = allergies;
        if (emergencyContact) patient.emergencyContact = emergencyContact;
        if (currentMedications) patient.currentMedications = currentMedications;

        if (address) {
            if (patient.address) {
                await Address.findByIdAndUpdate(patient.address, address);
            } else {
                const newAddress = await Address.create(address);
                patient.address = newAddress._id;
            }
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


         const deletedAddress = await Address.findByIdAndDelete(patient.address);
         if (!deletedAddress) {
             return res.status(400).json({ message: "Invalid address ID. Address could not be found." });
         }
        
        await Patient.findByIdAndDelete(id);
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
import { Address } from '../models/address.model.js';
import {Department} from '../models/department.model.js';
import {diseaseDepartmentMapping} from "../utils/diseaseDepartmentMapping.js";

const getDepartmentsByDisease = async (req, res) => {
  try {
    const { disease } = req.params;
    if (!disease) {
      return res.status(400).json({ message: "Disease name is required" });
    }

    const normalizedDisease = disease.trim().toLowerCase();
    const matchedDepartments = [];

    for (const [department, diseases] of Object.entries(diseaseDepartmentMapping)) {
      if (diseases.some(d => d.toLowerCase() === normalizedDisease)) {
        matchedDepartments.push(department);
      }
    }

    if (matchedDepartments.length === 0) {
      return res.status(404).json({ message: "No departments found for the given disease" });
    }

    res.status(200).json({
      message: "Departments found",
      data: matchedDepartments
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const getNearbyDoctorsAndHospitalsByDisease = async (req, res) => {
  try {
    const { disease } = req.params;
    const { lat, lng } = req.query;

    if (!disease || !lat || !lng) {
      return res.status(400).json({ message: "Disease, latitude, and longitude are required." });
    }

    const normalizedDisease = disease.trim().toLowerCase();
    const matchedDepartments = [];

    for (const [department, diseases] of Object.entries(diseaseDepartmentMapping)) {
      if (diseases.some(d => d.toLowerCase() === normalizedDisease)) {
        matchedDepartments.push(department);
      }
    }

    if (matchedDepartments.length === 0) {
      return res.status(404).json({ message: "No departments found for the given disease." });
    }

     // nearby hospitals within 10km
    const nearbyAddresses = await Address.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 10000 // 10 km
        }
      },
      hospitalId: { $ne: null }
    }).populate("hospitalId");

    const hospitalIds = nearbyAddresses.map(addr => addr.hospitalId._id);

    // Step 3: Get departments from these hospitals that match
    const departments = await Department.find({
      name: { $in: matchedDepartments },
      hospital: { $in: hospitalIds }
    }).populate({
      path: "doctors",
      populate: {
        path: "userId",
        select: "fullName email"
      }
    });

    res.status(200).json({
      message: "Nearby hospitals and doctors found for the given disease",
      matchedDepartments,
      hospitals: nearbyAddresses.map(addr => ({
        hospital: addr.hospitalId,
        address: addr
      })),
      departments: departments.map(dep => ({
        name: dep.name,
        hospital: dep.hospital,
        doctors: dep.doctors
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



export {  
          getDepartmentsByDisease ,
          getNearbyDoctorsAndHospitalsByDisease  
      };



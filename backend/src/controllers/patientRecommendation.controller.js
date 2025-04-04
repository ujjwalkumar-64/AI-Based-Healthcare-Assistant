import { Address } from '../models/addressModel.js';
import { Hospital } from '../models/hospitalModel.js';
import { Patient } from '../models/patientModel.js';

// Helper to get disease-related department
const getDepartmentFromDisease = (disease) => {
  // You can replace this with a better mapping if needed
  const mapping = {
    cardiology: ['heart attack', 'high blood pressure', 'chest pain'],
    dermatology: ['rash', 'acne', 'eczema'],
    neurology: ['headache', 'seizure', 'stroke'],
    pediatrics: ['fever', 'cold', 'cough'],
    // ... add more
  };

  for (const [dept, diseases] of Object.entries(mapping)) {
    if (diseases.includes(disease.toLowerCase())) {
      return dept;
    }
  }
  return null;
};

export const getNearbyHospitalsAndDoctors = async (req, res) => {
  try {
    const userId = req.user._id;
    const patient = await Patient.findOne({ userId }).populate('address');

    if (!patient || !patient.address || !patient.address.location) {
      return res.status(400).json({ message: 'Patient address with geolocation is required.' });
    }

    const disease = req.query.disease;
    if (!disease) {
      return res.status(400).json({ message: 'Disease query param is required.' });
    }

    const department = getDepartmentFromDisease(disease);
    if (!department) {
      return res.status(404).json({ message: 'No department found for the given disease.' });
    }

    const userCoords = patient.address.location.coordinates; // [lng, lat]

    // Find hospital addresses near user
    const nearbyHospitalAddresses = await Address.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: userCoords },
          $maxDistance: 10000 // 10km range
        }
      },
      hospitalId: { $exists: true }
    }).populate('hospitalId');

    const matchingHospitals = [];

    for (const addr of nearbyHospitalAddresses) {
      const hospital = await Hospital.findById(addr.hospitalId._id).populate('doctors');

      const matchingDept = hospital.departments.find(dep => dep.name === department);

      if (matchingDept) {
        matchingHospitals.push({
          hospitalName: hospital.name,
          hospitalType: hospital.type,
          contact: hospital.contact,
          address: addr,
          department: matchingDept.name,
          headDoctor: matchingDept.headDoctor
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Nearby hospitals and doctors in ${department} department`,
      hospitals: matchingHospitals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

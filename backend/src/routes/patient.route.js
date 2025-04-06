import { Router } from "express";

import {
    registerPatient,
    getPatient,
    updatePatient,
    deletePatient,
    getAllPatients
 
 } from "../controllers/patient.controller.js";

import { authUser } from "../middleware/auth.middleware.js";
import {authorizeRole} from "../middleware/authrization.middleware.js";

import {getDepartmentsByDisease ,
    getNearbyDoctorsAndHospitalsByDisease  } from "../controllers/patientRecommendation.controller.js";
const patientRouter = Router();

patientRouter.post("/register-patient", authUser, authorizeRole(['admin','patient']),registerPatient);
patientRouter.get("/all-patients", authUser, authorizeRole(['admin']), getAllPatients);
patientRouter.patch("/update-patient/:id", authUser, authorizeRole(['admin','patient']), updatePatient);
patientRouter.delete("/delete-patient/:id", authUser, authorizeRole(['admin']), deletePatient);
patientRouter.get("/nearby-doctors-hospitals/:disease", authUser, getNearbyDoctorsAndHospitalsByDisease);
patientRouter.get("/departments/:disease", authUser,authorizeRole(["admin","doctor"]), getDepartmentsByDisease);
patientRouter.get("/:id", authUser, authorizeRole(['admin','patient']), getPatient);



export default patientRouter;

// todo : doctor also fetch patient 
import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authrization.middleware.js";
import {getNearbyDoctorsAndHospitalsByDisease,getDepartmentsByDisease} from "../controllers/patientRecommendation.controller.js";
import { 
    createHospital,
    getAllHospitals ,
    getHospitalById,
    updateHospital,
    deleteHospital

    } from "../controllers/hospital.controller.js";

const hospitalRouter = Router();

hospitalRouter.post("/register-hospital",authUser,authorizeRole(["admin"]),createHospital)
hospitalRouter.get("/all-hospitals",authUser,getAllHospitals)
hospitalRouter.patch("/update-hospital/:id",authUser,authorizeRole(["admin"]),updateHospital)
hospitalRouter.delete("/delete-hospital/:id",authUser,authorizeRole(["admin"]),deleteHospital)
hospitalRouter.get("/get-doctors-and-hospitals-by-disease/:id",authUser,getNearbyDoctorsAndHospitalsByDisease)
hospitalRouter.get("/get-departments-by-disease/:id",authUser,getDepartmentsByDisease);
hospitalRouter.get("/:id",authUser,getHospitalById)

export default hospitalRouter
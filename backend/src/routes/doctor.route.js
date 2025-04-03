import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authrization.middleware.js";
import {registerDoctor, 
        getAllDoctors,
        getDoctorById,
        getMyDoctorProfile,
        updateDoctor,
        deleteDoctor
    } from "../controllers/doctor.controller.js"


const doctorRouter = Router();

doctorRouter.post("/register-doctor",authUser,authorizeRole(["admin","doctor"]),registerDoctor);
doctorRouter.get("/all-doctors",authUser,getAllDoctors);
doctorRouter.get("/profile",authUser,authorizeRole(["doctor"]),getMyDoctorProfile);
doctorRouter.patch("/update-doctor/:id",authUser,authorizeRole(["doctor","admin"]),updateDoctor);
doctorRouter.delete("/delete-doctor/:id",authUser,authorizeRole(["doctor","admin"]),deleteDoctor);
doctorRouter.get("/:id",authUser,getDoctorById);



export default doctorRouter;
import {Router} from "express"
import { authUser } from "../middleware/auth.middleware.js"
import { authorizeRole } from "../middleware/authrization.middleware.js"

import {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    updateAppointmentStatus,
    deleteAppointment

} from "../controllers/appointment.controller.js"

const appointmentRouter = Router();

appointmentRouter.post("/register-appointment",authUser,createAppointment);
appointmentRouter.get("/all-appointments",authUser,authorizeRole(["admin"]),getAllAppointments);
appointmentRouter.get("/my-appointments",authUser,authorizeRole(["patient",'doctor']),getMyAppointments);
appointmentRouter.patch("/update-appointment-status/:id",authUser,authorizeRole(["admin",'doctor']),updateAppointmentStatus);
appointmentRouter.delete("/delete-appointment/:id",authUser,authorizeRole(["admin"]),deleteAppointment);



export default appointmentRouter

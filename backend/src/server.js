import express from 'express';
import cookieParser from 'cookie-parser';
import { mongoDB } from './config/mongoDB.js';
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.send('Server is running!');
});

import userRouter from './routes/user.route.js';
import patientRouter from './routes/patient.route.js';
import doctorRouter from './routes/doctor.route.js';
import  hospitalRouter from './routes/hospital.route.js';
import appointmentRouter from "./routes/appointment.route.js";
import aiPredictionRouter from './routes/aiPrediction.route.js';


app.use('/api/user', userRouter);
app.use('/api/patient', patientRouter);
app.use("/api/doctor",doctorRouter);
app.use("/api/hospital",hospitalRouter);
app.use('/api/appointment',appointmentRouter);
app.use('/api/ai-prediction', aiPredictionRouter);


try {
    await mongoDB();
    app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
} catch (error) {
    console.log("server fail to connect: "+error)
}

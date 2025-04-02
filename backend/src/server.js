import express from 'express';
import cookieParser from 'cookie-parser';
import { mongoDB } from './config/mongoDB.js';
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// Routes
app.get('/', (req, res) => {
    res.send('Server is running!');
});

import userRouter from './routes/user.route.js';
import patientRouter from './routes/patient.route.js';
app.use('/api/user', userRouter);
app.use('/api/patient', patientRouter);
try {
    await mongoDB();
    app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
} catch (error) {
    console.log("server fail to connect: "+error)
}

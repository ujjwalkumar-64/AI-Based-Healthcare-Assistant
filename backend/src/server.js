import express from 'express';
import { mongoDB } from './config/mongoDB.js';
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());


// Routes
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
try {
    await mongoDB();
    app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
} catch (error) {
    console.log("server fail to connect: "+error)
}

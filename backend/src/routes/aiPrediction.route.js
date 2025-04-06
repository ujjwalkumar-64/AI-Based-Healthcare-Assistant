import {Router} from 'express';
import { authUser } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/authrization.middleware.js';
import {createAiPrediction,
    getAllAiPredictions,
    getAiPredictionById,
    deleteAiPrediction
} from '../controllers/aiPrediction.controller.js';


const aiPredictionRouter = Router();

aiPredictionRouter.post('/register-prediction',authUser,createAiPrediction);

aiPredictionRouter.get('/all-predictions',authUser,authorizeRole(["admin","doctor"]),getAllAiPredictions);
aiPredictionRouter.delete('/delete-prediction/:id',authUser,authorizeRole(["admin"]),deleteAiPrediction);
aiPredictionRouter.get('/:id',authUser,authorizeRole(["admin","doctor"]),getAiPredictionById);
export default aiPredictionRouter;
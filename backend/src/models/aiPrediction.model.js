import mongoose from 'mongoose';

const aiPredictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    predicted_disease: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    precautions: {
        type: [String],
        required: true
    },
    medications: {
        type: [String],
        required: true
    },
    workout: {
        type: [String],
        required: true
    },
    diets: {
        type: [String],
        required: true
    }
}, {
    timestamps: true
});





 export const AiPrediction = mongoose.model('AiPrediction', aiPredictionSchema);

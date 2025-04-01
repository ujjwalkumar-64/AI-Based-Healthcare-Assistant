import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    medicalHistory: {
        type: String,
        required: true
    },
    allergies: {
        type: String,
        required: true
    },
    aiPredictions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AiPrediction',
        required: false
    },
    emergencyContact: {
        name: {
            type: String,
            required: true
        },
        relation: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
            validate(value) {
                if (!/^\d{10}$/.test(value)) {
                    throw new Error("Invalid phone number format. Must be 10 digits.");
                }
            }
        }
    },
    currentMedications: {
        type: [String],
        default: []
    },
    
    appointments: [{
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
            default: 'Pending'
        }
    }]
}, { timestamps: true });
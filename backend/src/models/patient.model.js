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
                const isValidMobilePhone = validator.isMobilePhone(value, 'any', { strictMode: false });
                const isTenDigits = /^\d{10}$/.test(value);
                
                if (!isValidMobilePhone || !isTenDigits) {
                    throw new Error("Invalid phone number format. Must be 10 digits and a valid mobile phone.");
                }
            }
        }
    },
    address:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Address"
    },
    currentMedications: {
        type: [String],
        default: []
    },
    
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }],
}, { timestamps: true });

export const Patient = mongoose.model('Patient', patientSchema);
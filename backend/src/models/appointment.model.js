import mongoose from 'mongoose';

const appointmentsSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Patient'
        
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor'
    },
    hospitalId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Hospital",
        required:true,
    },
    appointmentDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'canceled'],
        default: 'scheduled'
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentsSchema);
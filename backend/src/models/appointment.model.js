import mongoose from 'mongoose';

const appointmentsSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
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
        enum: ['pending','scheduled', 'completed', 'canceled'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentsSchema);
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema( {
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    specialization: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        enum: {
            values: ['Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'],
            message: '{VALUE} is not supported'
        }
    },
    medicalLicense: {
        type: String,
        required: true
    },
    experienceYears: {
        type: Number,
        required: true
    },
    hospitalAffiliation: {
        type: String,
        required: true
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    }
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', doctorSchema);

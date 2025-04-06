import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true,
        lowercase:true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
});

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
            values: ['cardiology', 'dermatology', 'endocrinology', 'gastroenterology', 'neurology', 'oncology', 'pediatrics',  'surgery'],
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
        required: false
    },
    availability: {
        type:[availabilitySchema],
        required:true,
        validate: {
            validator: function (value) {
 
                return value.length > 0 && value.every(slot => slot.day && slot.startTime && slot.endTime);
            },
            message: 'Each availability slot must include day, startTime, and endTime, and the array cannot be empty.',
        },
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Address",
        required:true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
       
    },
    patients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient'
        }
    ],
    appointments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    ]
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', doctorSchema);

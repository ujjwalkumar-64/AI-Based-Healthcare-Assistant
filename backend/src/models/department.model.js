import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase:true,
        enum: {
            values: ['cardiology', 'dermatology', 'endocrinology', 'gastroenterology', 'neurology', 'oncology', 'pediatrics', 'psychiatry', 'radiology', 'surgery'],
            message: '{VALUE} is not supported'
        }
    },
    headDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required:true,
    },
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    }],
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
        required:true,
    },
},{timestamps:true});

export const Department = mongoose.model("Department", departmentSchema);


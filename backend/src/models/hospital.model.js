import mongoose from "mongoose";
import validator from 'validator';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique:true,
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
        unique:true
    },
})

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ["Private", "Government", "Clinic", "Specialty"],
        required: true,
    },
    contact: {
        phone: {
                type: String,
                trim: true,
                required: true,
                validate(value) {
                    const isValidMobilePhone = validator.isMobilePhone(value, 'any', { strictMode: false });
                     
                    
                    if (!isValidMobilePhone  ) {
                        throw new Error("Invalid phone number format. Must be 10 digits and a valid mobile phone.");
                    }
                }
        },
        email:{
                type:String,
                required:true,
                trim:true,
                index:true,
                unique:true,
                validate(value){
                    if(!validator.isEmail(value)){
                        throw new Error("Invalid email address");
                    }
                }
        },
        website: {
            type: String,
            required: false,
            trim: true,
            validate(value){
                if(!validator.isURL(value)){
                    throw new Error("Invalid website url")
                }
            }
        }
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
    },
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
    }],
    departments:{
        type:[departmentSchema],
        required:true,
        validate: {
            validator: function (value) {
 
                return value.length > 0 && value.every(slot => slot.name && slot.headDoctor );
            },
            message: 'Each availability slot must include name and headDoctor, and the array cannot be empty.',
        },
    },
}, { timestamps: true });

hospitalSchema.pre('save', function (next) {
    
    const departmentNames = this.departments.map(department => department.name);
    const headDoctors = this.departments.map(department => department.headDoctor.toString());

     
    if (new Set(departmentNames).size !== departmentNames.length) {
        return next(new Error("Duplicate department names are not allowed within the same hospital."));
    }

    if (new Set(headDoctors).size !== headDoctors.length) {
        return next(new Error("A doctor cannot be the head of multiple departments within the same hospital."));
    }

    next();
});


export const Hospital = mongoose.model("Hospital", hospitalSchema);

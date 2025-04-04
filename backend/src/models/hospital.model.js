import mongoose from "mongoose";
import validator from 'validator';

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique:true
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
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Department",
        required:true,
    },
}, { timestamps: true });



export const Hospital = mongoose.model("Hospital", hospitalSchema);

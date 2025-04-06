import mongoose from "mongoose";
import validator from "validator";

const addressSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Doctor",
        index: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Patient",
        index: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
        index: true
    },
    addressType: {
        type: String,
        required: true,
        enum: ["home", "work", "other"],
    },
    street: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    postalCode: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isPostalCode(value, "any")) {
                throw new Error("Invalid postal code");
            }
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
           
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            validate: {
                validator: function (value) {
                    return value.length === 2;  
                },
                message: "Coordinates must be an array of [longitude, latitude]",
            },
            required: true,
        }
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department"
    }
},{timestamps:true});

addressSchema.index({ location: "2dsphere" }); // for geospatial queries

export const Address = mongoose.model("Address", addressSchema);

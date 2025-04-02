import mongoose from "mongoose";
import validator from "validator"
const addressSchema = new mongoose.Schema({
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
        validate(value){
            if(!validator.isPostalCode(value,"any")){
                throw new Error("Invalid postal code")
            }
        }
    },
});

export const Address = mongoose.model("Address", addressSchema);

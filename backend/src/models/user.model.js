import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true,
        minLength:2,
    },

    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        index:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email address");
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:6,
    },
    role:{
        type:String,
        enum:{
            values:["admin","patient","doctor"],
            default:"patient",
            message:"{VALUE} is not supported"
        },
        required:true,
        lowercase:true,
    },

    phone: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            const isValidMobilePhone = validator.isMobilePhone(value, 'any', { strictMode: false });
            const isTenDigits = /^\d{10}$/.test(value);
            
            if (!isValidMobilePhone || !isTenDigits) {
                throw new Error("Invalid phone number format. Must be 10 digits and a valid mobile phone.");
            }
        }
    },
    dob:{
        type:Date,
        required:true,
        validate(value){
            if(value > Date.now()){
                throw new Error("Date of birth cannot be in the future")
            }
        }
    },
    gender:{
        type:String,
        required:true,
        enum:{
            values:["male","female","other"],
            message:"{VALUE} is not supported"
        }
    },
   
   
},{timestamps:true});

userSchema.methods.validatePassword = async function (inputPassword) {
    try {
        const hashPassword = this.password;
        const isPasswordValid = await bcrypt.compare(inputPassword, hashPassword);
        return isPasswordValid;
    } catch (error) {
        throw new Error("Password validation failed.");
    }
};


userSchema.methods.getJwt = async function (){
    const token = await jwt.sign(
        { _id: this._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1d" ,

        }
    );
    return token;
}



export const User = mongoose.model("User",userSchema)


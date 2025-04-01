import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
        index:true,
        minLength:2,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
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

    // common fields
    phone:{
        type:Number,
        required:true,
        trim:true,
        unique:true,
        validate(value) {
            if (!/^\d{10}$/.test(value)) {
                throw new Error("Invalid phone number format. Must be 10 digits.");
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
        enum:{
            values:["male","female","other"],
            message:"{VALUE} is not supported"
        }
    },
    address:{
        type:String,
        trim:true,
    },

    //role based fields
    doctorInfo:{
        type:mongoose.Schema.Typse.ObjectId,
        ref:"Doctor",
        required:function(){
            return this.role === "doctor";
        }
    },

    patientInfo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Patient",
        required:function(){
            return this.role ==="patient";
        }
    },

    adminInfo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Admin",
        required:function(){
            return this.role ==="admin";
        }
    }
   
},{timestamps:true});

userSchema.methods.validatePassword = async function (inputPassword){
    const hashPassoword= this.password

    const isPasswordValid = await bcrypt.compare(
        inputPassword,
        hashPassoword
    );
    return isPasswordValid;
}

userSchema.methods.getJwt = async function (){
    const token = await jwt.sign(
        { _id: this._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    return token;
}

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

export const User = mongoose.model("User",userSchema)


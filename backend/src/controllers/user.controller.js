import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { validateSignupData } from "../utils/validator.js";

const register =async (req,res)=>{
    try {
        validateSignupData(req);
        const {fullName,email,password,role,phone,dob,gender} = req.body
    
        const hashPassword = await bcrypt.hash(password,10);
        const user = new User({
            fullName,
            email,
            password:hashPassword,
            role,
            phone,
            dob,
            gender
            
        })
    
        const savedUser= await user.save()
        const token= await savedUser.getJwt();
            res.cookie("token",token,{
                expires: new Date(Date.now()+ 1 * 3600000),
                httponly:true,
                secure:true
            })
            
          
        res.status(200).json({
            message:"user added successfully!",
             data: savedUser
            })

    } catch (error) {
        res.status(400).send("error: " + error.message)
    }
}
 

const login = async(req,res)=>{
    try {
        const {email,password} = req.body
        const user = await User.findOne({email:email}) 
        if(!user){
            throw new Error("invalid email credential ")
        }
        const isPasswordValid = await user.validatePassword(password)

        if(!isPasswordValid){
             
            throw new Error("invalid password credential ")
        }
        else{
             
            const token= await user.getJwt();
            res.cookie("token",token,{
                expires: new Date(Date.now()+ 1 * 3600000),
                httponly:true,
                secure:true
            })
            
            res.status(200).json({
                message:"user login successfully",
                data:user
            })

        }

    } catch (error) {
        res.status(500).send("error :" + error.message)
    }
}

const logout = async(req,res)=>{
    res.cookie("token",null,{
        expires:
            new Date(Date.now()),
        httponly:true,
        secure:true
        
    })
    res.status(200).json({
        message:"user logged out successfully",
    })
}


export {
    register,
    login,
    logout
};
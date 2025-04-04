import validator from "validator";

const validateSignupData= (req)=>{
    const {fullName,email,password,role} = req.body
    if(!fullName){
        throw new Error("name is not valid")
    }
    else if(!role){
        throw new Error("role is not valid")
    }
    
    else if(!validator.isEmail(email)){
        throw new Error("email is not valid")
    }
    else if (!validator.isStrongPassword(password)){
        throw new Error("password is not strong")
    }
};


 


export  {
    validateSignupData,
 
}
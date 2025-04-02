import {User} from '../models/user.model.js';
import jwt from 'jsonwebtoken';


const authUser = async(req,res,next)=>{
    try {
        const{token}= req.cookies
        if(!token){
            return res.status(401).send("please login")
        }
        const decodedMessage= await jwt.verify(token,process.env.JWT_SECRET);

        const{_id}= decodedMessage;
        const user = await User.findById(_id);

        if(!user){
            throw new Error("invalid user")
        }
        req.user = user
        next();

    } catch (error) {
        res.status(400).send("error: "+ error.message)
    }
}

export {
    authUser
}
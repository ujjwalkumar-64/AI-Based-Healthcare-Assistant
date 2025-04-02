import { Router } from 'express';
import { register, login, logout } from '../controllers/user.controller.js';
import {authUser} from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.get('/logout',authUser, logout);

export default userRouter;

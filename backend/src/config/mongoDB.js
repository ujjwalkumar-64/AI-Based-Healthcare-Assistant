import mongoose from 'mongoose';

const mongoDB = async () => {
    try {
       const mongoURI = process.env.MONGO_URI ; 
         if (!mongoURI) {
                throw new Error('MongoDB URI is not defined in environment variables.');
          }
          await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export {mongoDB};
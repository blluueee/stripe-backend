import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        const dbConnection = await mongoose.connect(process.env.MONGO_URI as string)
        console.log(`MongoDB connected: ${dbConnection.connection.host}`);
    } catch(error) {
        console.error("Database connection failed", error)
        // process.exit(1)
    }
}
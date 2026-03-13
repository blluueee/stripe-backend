import jwt from "jsonwebtoken"
import { Response, NextFunction } from "express"
import { Request } from "../types/request"
import User from "../models/User"

interface JwtPayload {
    id: string
}

export const authMiddleware = async( req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]
    if(!token) {
        return res.status(401).json({message: "No token provided"})
    }

    try { 
        const decoded: any = jwt.verify(token, process.env.JWT_SECRETKEY!) as JwtPayload
        const user = await User.findById(decoded.id )
        
        if(!user) {
                return res.status(404).json({message: "User not found"})
            }
            req.user = user
            req.userId = user._id

        // console.log("User info from token:", req.authUser);
        next()
    } catch {
        res.status(401).json({ message: "Token invalid" })
    }
}
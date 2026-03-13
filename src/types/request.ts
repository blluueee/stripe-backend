import { Request as expressRequest} from "express"
import {IUser} from "../models/User"
import { ObjectId } from "mongoose"

export interface Request extends expressRequest{
    user? : IUser,
    userId? : ObjectId
}
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const requiredFields = { email, password };
    const missingFields = await Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length) {
      return res.status(400).json({
        message: "Missing these required fields: ",
        missingFields,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists", email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    res.status(200).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email
    }
    });
  } catch (err) {
    res.status(500).json({message: "User registration failed", err});
  }
};

export const login = async (req: Request, res: Response) => {
  try {
  const { email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({message: "Both email and password is required"});
  }

  const user = await User.findOne({email});
  if (!user) {
    return res.status(404).json({ message: "User not found", user});
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch) {
    return res.status(404).json({ message: "Invalid credentials"});
  }

  if(!process.env.JWT_SECRETKEY){
    throw new Error("JWT_SECRET not defined");
  }

  const token = jwt.sign(
    {id: user._id},
    process.env.JWT_SECRETKEY
  );

  res.json({token, user: { id: user._id, email: user.email}});

} catch(error) {
  console.error("Login error:", error);
  res.status(500).json({message: "Login failed"});
}
}
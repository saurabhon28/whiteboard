import { User } from "../models/userModels.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//Login the user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "Invalid Data",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password); // Compare hashed password
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    const tokenData = {
      id: user._id,
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    return res
      .status(200)
      .cookie("token", token, { httponly: true })
      .json({
        message: `Welcome back ${user.fullName}`,
        success: true,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//Logout the user
export const logoutUser = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", { expiresIn: new Date(Date.now()), httponly: true })
      .json({
        message: "User logged out successfully",
        success: true,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//Register the user
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(401).json({
        message: "Invalid Data",
        success: false,
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        message: "This email is already used",
        success: false,
      });
    }
    //hashing the password
    const hashedPassword = await bcrypt.hash(password, 16);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "Registered successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

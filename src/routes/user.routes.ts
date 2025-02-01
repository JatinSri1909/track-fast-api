import { Router, RequestHandler, Request, Response } from "express"
import bcrypt from "bcryptjs"
import User from "../models/user.model"
import { generateTokens, verifyRefreshToken } from "../utils/token"

const router: Router = Router()

const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body
    
    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" })
      return 
    }

    const user = new User({ firstName, lastName, email, password })
    await user.save()

    // Generate tokens after registration
    const { accessToken, refreshToken } = generateTokens(user._id.toString())
    
    // Save refresh token
    user.refreshToken = refreshToken
    await user.save()

    // Set cookies
    res.cookie("token", accessToken, { 
      httpOnly: true, 
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })
    return
  } catch (error) {
    res.status(500).json({ message: "Error creating user" })
    return
  }
}

const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" })
      return
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      res.status(400).json({ message: "Invalid credentials" })
      return
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString())

    // Save refresh token to user document
    user.refreshToken = refreshToken
    await user.save()

    // Set cookies
    res.cookie("token", accessToken, { 
      httpOnly: true, 
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/refresh-token' // Only sent to refresh token endpoint
    })

    res.json({ message: "Logged in successfully" })
  } catch (error) {
    res.status(500).json({ 
      message: "Error logging in", 
      error: error instanceof Error ? error.message : String(error) 
    })
  }
}

const refreshToken: RequestHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token required" })
      return
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    
    // Find user and verify refresh token matches
    const user = await User.findById(payload.userId)
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: "Invalid refresh token" })
      return
    }

    // Generate new tokens
    const tokens = generateTokens(user._id.toString())
    
    // Update refresh token in database
    user.refreshToken = tokens.refreshToken
    await user.save()

    // Set new cookies
    res.cookie("token", tokens.accessToken, { 
      httpOnly: true, 
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/refresh-token'
    })

    res.json({ message: "Token refreshed successfully" })
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" })
  }
}

const logout: RequestHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      )
    }

    res.clearCookie("token", { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    res.clearCookie("refreshToken", { path: '/api/refresh-token' })
    
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    res.status(500).json({ 
      message: "Error logging out", 
      error: error instanceof Error ? error.message : String(error) 
    })
  }
}

// Routes
router.post("/register", register)
router.post("/login", login)
router.post("/refresh-token", refreshToken)
router.post("/logout", logout)

export default router



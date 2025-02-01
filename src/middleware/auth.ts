import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/token"

export default async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    try {
      const decoded = await verifyToken(token)
      ;(req as any).user = decoded
      next()
    } catch (error) {
      // Token is invalid or expired
      res.clearCookie('token', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return res.status(401).json({ 
        message: "Invalid or expired token",
        code: 'TOKEN_EXPIRED'
      })
    }
  } catch (error) {
    return res.status(500).json({ message: "Auth middleware error" })
  }
}
import jwt from 'jsonwebtoken'

export const generateTokens = (userId: string) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT secrets not configured')
  }

  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Short lived access token
  })

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d', // Longer lived refresh token
  })

  return { accessToken, refreshToken }
}

export const verifyRefreshToken = (token: string) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET not configured')
  }

  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as { userId: string }
}

export const verifyToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  return jwt.verify(token, process.env.JWT_SECRET) as { userId: string }
} 
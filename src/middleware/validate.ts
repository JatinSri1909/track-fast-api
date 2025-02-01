import { Request, Response, NextFunction, RequestHandler } from "express"
import { AnyZodObject, ZodError } from "zod"

export const validate = (schema: AnyZodObject): RequestHandler => 
  async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Validation failed",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  } 
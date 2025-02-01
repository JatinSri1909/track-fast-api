import { Router, RequestHandler } from "express"
import type { Request, Response } from "express"
import Expense from "../models/expense.model"
import auth from "../middleware/auth"
import { z } from "zod"
import logger from "../utils/logger"
import { validate } from "../middleware/validate"

interface AuthRequest extends Request {
  user: { userId: string }
}

const router: Router = Router()

// Protect all expense routes
router.use(auth as RequestHandler)

const expenseSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    date: z.string(),
    description: z.string().optional()
  })
})

const querySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('10'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['date', 'amount', 'category']).optional().default('date'),
    order: z.enum(['asc', 'desc']).optional().default('desc')
  })
})

const createExpense: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { amount, category, date, description } = req.body
    
    // Log the incoming request
    logger.info('Creating expense', { body: req.body, userId: (req as AuthRequest).user.userId })
    
    const expense = new Expense({ 
      amount: Number(amount), // Ensure amount is a number
      category, 
      date: new Date(date), // Convert string to Date
      description, 
      user: (req as AuthRequest).user.userId 
    })
    
    await expense.save()
    res.status(201).json(expense)
  } catch (error) {
    logger.error('Error creating expense', { error, body: req.body })
    next(error)
  }
}

const getExpenses: RequestHandler = async (req, res): Promise<void> => {
  try {
    const parsedQuery = querySchema.parse({ query: req.query })
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      category,
      search,
      sort = 'date', 
      order = 'desc' 
    } = parsedQuery.query
    
    const query: Record<string, any> = { user: (req as AuthRequest).user.userId }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(String(startDate)),
        $lte: new Date(String(endDate))
      }
    }
    
    if (category) {
      query.category = category
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        ...(isNaN(Number(search)) ? [] : [{ amount: Number(search) }])
      ]
    }

    const sortField = String(sort)
    const sortOptions: Record<string, 1 | -1> = { [sortField]: order === 'desc' ? -1 : 1 }
    
    const pageNum = Number(page)
    const limitNum = Number(limit)
    
    // Use lean() for better performance
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
        .select('-__v'),
      Expense.countDocuments(query)
    ])

    logger.info('Expenses fetched', { userId: (req as AuthRequest).user.userId, query })

    res.json({
      expenses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    logger.error('Error fetching expenses', { error, userId: (req as AuthRequest).user.userId })
    res.status(500).json({ 
      message: "Error fetching expenses",
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

const getInsights: RequestHandler = async (req, res): Promise<void> => {
  try {
    const expenses = await Expense.find({ user: (req as AuthRequest).user.userId })
    const totalByCategory = expenses.reduce((acc: { [key: string]: number }, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as { [key: string]: number })
    const total = Object.values(totalByCategory).reduce((sum, amount) => sum + amount, 0)
    const distribution = Object.entries(totalByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / total) * 100).toFixed(2),
    }))
    res.json({ totalByCategory, distribution })
  } catch (error) {
    res.status(500).json({ message: "Error fetching insights" })
  }
}

const updateExpense: RequestHandler = async (req, res): Promise<void> => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: (req as AuthRequest).user.userId },
      req.body,
      { new: true }
    )
    if (!expense) {
        res.status(404).json({ message: "Expense not found" })
        return 
    }
    res.json(expense)
  } catch (error) {
    res.status(500).json({ message: "Error updating expense" })
  }
}

const deleteExpense: RequestHandler = async (req, res): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: (req as AuthRequest).user.userId
    })
    if (!expense) {
        res.status(404).json({ message: "Expense not found" })
        return 
    }
    res.json({ message: "Expense deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting expense" })
  }
}

// Type assertion to handle middleware chain
router.post("/", validate(expenseSchema), createExpense)
router.get("/", validate(querySchema), getExpenses)
router.get("/insights", getInsights)
router.patch("/:id", validate(expenseSchema), updateExpense)
router.delete("/:id", deleteExpense)

export default router


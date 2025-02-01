import mongoose from "mongoose"

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, index: true },
    category: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
)

// Compound index for common queries
expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1 })

export default mongoose.model("Expense", expenseSchema)


import express from "express"
import dotenv from "dotenv"
import paymentRoutes from "./routes/pay.route"
import { stripeWebhook } from "./webhooks/stripe.webhook"
import { connectDB } from "./db/db"
import { Response, NextFunction } from "express"
import { Request } from "./types/request"

dotenv.config()

const app = express()
connectDB()
app.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook)
app.use(express.json())
app.use("/payments", paymentRoutes)
app.get("/success",(req: Request, res: Response)=>{
    res.json({message: "payment susccesfull"})
})
app.get("/failed",(req: Request, res: Response)=>{
    res.send("payment failed")
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
import { getInvoice } from "../services/invoice.service"
import { Request } from "../types/request"
import { Response } from "express"

export const fetchInvoice = async (req: Request, res:Response) => {
    try {
        const { invoiceId } = req.params
        if(Array.isArray(invoiceId)){
            throw new Error("Invalid invoiceId")
        }
        const pdfUrl = await getInvoice(invoiceId)

        res.json({ pdf: pdfUrl })
        // res.redirect({ pdfUrl })
    } catch(error:any) {
        return res.status(400).json({ error: error.message })
    }
}
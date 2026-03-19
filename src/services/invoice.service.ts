import { stripe } from "../config/stripe"

export const generateInvoice = async (customerId: string, amount: number, description: string) => {
    await stripe.invoiceItems.create({
        customer: customerId, 
        amount: Math.round(amount*100),
        currency: "usd",
        description
    })

    const invoice = await stripe.invoices.create({ customer: customerId })

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
    return finalizedInvoice
}

export const getInvoice = async (invoiceId: string) => {
    const invoice = await stripe.invoices.retrieve(invoiceId)

    if(!invoice.invoice_pdf){
        throw new Error("Invoice not finalized yet")
    }
    return invoice.invoice_pdf
}
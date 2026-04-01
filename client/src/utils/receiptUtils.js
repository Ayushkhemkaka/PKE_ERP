const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    return numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const buildPrintableOrder = (input) => ({
    id: input.id,
    orderType: input.orderType || 'Standard',
    invoiceNumber: `${input.bookNumber}/${input.slipNumber}`,
    name: input.name,
    source: input.source,
    item: input.item,
    quantityDisplay: input.quantity ? `${input.quantity} ${input.measurementUnit}` : (input.measurementUnit || 'Pending'),
    rate: input.rate,
    amount: input.amount,
    freight: input.freight,
    total: input.totalAmount,
    date: input.date,
    paymentStatus: input.paymentStatus,
    dueAmount: input.paymentStatus === 'Due' ? input.dueAmount : 0,
    customerAccountName: input.customerAccountName || '',
    isPrinted: Boolean(input.is_printed ?? input.isPrinted),
    printedBy: input.printed_by || input.printedBy || ''
});

const getPaymentSummary = (order) => {
    return order.paymentStatus === 'Due'
        ? `Due - ${formatCurrency(order.dueAmount)}`
        : `${order.paymentStatus} - ${formatCurrency(order.dueAmount)}`;
}

const buildInvoiceHtml = (order, titleSuffix) => {
    const paymentLine = getPaymentSummary(order);
    const customerAccountRow = order.customerAccountName
        ? `<div class="row"><div class="label">Customer Account</div><div class="value">${order.customerAccountName}</div></div>`
        : '';

    return `
        <html>
            <head>
                <title>Invoice ${order.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #1f2933; padding: 32px; }
                    .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #d8dee4; border-radius: 18px; padding: 28px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                    .title { font-size: 28px; font-weight: 700; margin: 0; }
                    .subtitle { color: #52606d; margin-top: 6px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
                    .row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #7b8794; margin-bottom: 4px; }
                    .value { font-size: 18px; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="sheet">
                    <div class="header">
                        <div>
                            <p class="title">P. K. ENTERPRISES</p>
                            <p class="subtitle">${titleSuffix}</p>
                        </div>
                        <div>
                            <div class="label">Invoice No</div>
                            <div class="value">${order.invoiceNumber}</div>
                        </div>
                    </div>
                    <div class="grid">
                        ${customerAccountRow}
                        <div class="row"><div class="label">Name</div><div class="value">${order.name}</div></div>
                        <div class="row"><div class="label">Date</div><div class="value">${order.date}</div></div>
                        <div class="row"><div class="label">Source</div><div class="value">${order.source}</div></div>
                        <div class="row"><div class="label">Item</div><div class="value">${order.item}</div></div>
                        <div class="row"><div class="label">Quantity</div><div class="value">${order.quantityDisplay}</div></div>
                        <div class="row"><div class="label">Rate</div><div class="value">${formatCurrency(order.rate)}</div></div>
                        <div class="row"><div class="label">Amount</div><div class="value">${formatCurrency(order.amount)}</div></div>
                        <div class="row"><div class="label">Freight</div><div class="value">${formatCurrency(order.freight)}</div></div>
                        <div class="row"><div class="label">Total</div><div class="value">${formatCurrency(order.total)}</div></div>
                        <div class="row"><div class="label">Payment Status</div><div class="value">${paymentLine}</div></div>
                    </div>
                </div>
            </body>
        </html>
    `;
}

export { formatCurrency, buildPrintableOrder, getPaymentSummary, buildInvoiceHtml };

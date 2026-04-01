const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    return numericValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildPrintableOrder = (input) => ({
    id: input.id,
    orderType: input.orderType || 'Standard',
    invoiceNumber: `${input.bookNumber}/${input.slipNumber}`,
    name: input.name,
    site: input.site,
    source: input.source,
    item: input.item,
    quantity: Number(input.quantity || 0),
    gross: Number(input.gross || 0),
    tare: Number(input.tare || 0),
    net: Number(input.net || 0),
    measurementUnit: input.measurementUnit || '',
    showQuantity: String(input.measurementUnit || '').toLowerCase() === 'cft',
    quantityDisplay: input.quantity ? `${input.quantity} ${input.measurementUnit}` : (input.measurementUnit || 'Pending'),
    rate: input.rate,
    amount: input.amount,
    freight: input.freight,
    total: input.totalAmount,
    date: input.date,
    paymentStatus: input.paymentStatus,
    dueAmount: input.paymentStatus === 'Due' ? input.dueAmount : 0,
    remarks: input.remarks || '',
    lorryNumber: input.lorryNumber || '',
    customerAccountName: input.customerAccountName || '',
    customerGstin: input.customerGstin || '',
    isPrinted: Boolean(input.is_printed ?? input.isPrinted),
    printedBy: input.printed_by || input.printedBy || ''
});

const getPaymentSummary = (order) => {
    return order.paymentStatus === 'Due'
        ? `Due - ${formatCurrency(order.dueAmount)}`
        : `${order.paymentStatus} - ${formatCurrency(order.dueAmount)}`;
}

const buildInvoiceHtml = (order, titleSuffix) => {
    const quantityPrimaryLabel = order.showQuantity ? 'Quantity' : 'Gross';
    const quantityPrimaryValue = order.showQuantity
        ? `${escapeHtml(order.quantity)}`
        : `${escapeHtml(order.gross)}`;
    const quantitySecondaryLabel = order.showQuantity ? 'Measurement' : 'Tare';
    const quantitySecondaryValue = order.showQuantity
        ? escapeHtml(order.measurementUnit || '-')
        : `${escapeHtml(order.tare)}`;
    const quantityTertiaryLabel = order.showQuantity ? 'Source' : 'Net';
    const quantityTertiaryValue = order.showQuantity
        ? escapeHtml(order.source || '-')
        : `${escapeHtml(order.net)}`;

    const challanMarkup = `
        <div class="challan-card">
            <div class="challan-topline">Railway Gate Pass / Challan</div>
            <div class="challan-header">
                <div class="brand-block">
                    <div class="brand-name">P. K. ENTERPRISES</div>
                    <div class="brand-copy">Harinagar - 845106, Bihar</div>
                    <div class="brand-copy">GSTIN - 10AENPK8366A1ZQ</div>
                </div>
                <div class="meta-block">
                    <div class="meta-row">
                        <span>Sl. No.</span>
                        <strong>${escapeHtml(order.invoiceNumber)}</strong>
                    </div>
                    <div class="meta-row">
                        <span>Date</span>
                        <strong>${escapeHtml(order.date)}</strong>
                    </div>
                </div>
            </div>
            <div class="challan-grid">
                <div class="cell cell-full">
                    <span>M/s</span>
                    <strong>${escapeHtml(order.name)}</strong>
                </div>
                <div class="cell">
                    <span>GSTN</span>
                    <strong>${escapeHtml(order.customerGstin || '-')}</strong>
                </div>
                <div class="cell">
                    <span>Dly. Point</span>
                    <strong>${escapeHtml(order.site || '-')}</strong>
                </div>
                <div class="cell">
                    <span>Material/Size</span>
                    <strong>${escapeHtml(order.item)}</strong>
                </div>
                <div class="cell">
                    <span>${quantityPrimaryLabel}</span>
                    <strong>${quantityPrimaryValue}</strong>
                </div>
                <div class="cell">
                    <span>${quantitySecondaryLabel}</span>
                    <strong>${quantitySecondaryValue}</strong>
                </div>
                <div class="cell">
                    <span>${quantityTertiaryLabel}</span>
                    <strong>${quantityTertiaryValue}</strong>
                </div>
                <div class="cell">
                    <span>Rate</span>
                    <strong>${escapeHtml(formatCurrency(order.rate))}</strong>
                </div>
                <div class="cell">
                    <span>MOD</span>
                    <strong>${escapeHtml(order.paymentStatus || '-')}</strong>
                </div>
                <div class="cell">
                    <span>Amount</span>
                    <strong>${escapeHtml(formatCurrency(order.amount))}</strong>
                </div>
                <div class="cell">
                    <span>FRT</span>
                    <strong>${escapeHtml(formatCurrency(order.freight))}</strong>
                </div>
                <div class="cell cell-full">
                    <span>Vehicle No.</span>
                    <strong>${escapeHtml(order.lorryNumber || '-')}</strong>
                </div>
                <div class="cell cell-full">
                    <span>Remarks</span>
                    <strong>${escapeHtml(order.remarks || '-')}</strong>
                </div>
            </div>
        </div>`;

    return `
        <html>
            <head>
                <title>Invoice ${escapeHtml(order.invoiceNumber)}</title>
                <style>
                    @page { size: A4 portrait; margin: 8mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: Arial, sans-serif; color: #111; }
                    .print-header { margin-bottom: 6mm; text-align: center; font-size: 11px; color: #555; }
                    .sheet-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; }
                    .challan-card { border: 1px solid #111; min-height: 90mm; display: grid; grid-template-rows: auto auto 1fr; }
                    .challan-topline { text-align: center; font-size: 10px; font-weight: 700; padding: 2mm 1mm; border-bottom: 1px solid #111; }
                    .challan-header { display: grid; grid-template-columns: 1.35fr 0.65fr; border-bottom: 1px solid #111; }
                    .brand-block { padding: 2.2mm; border-right: 1px solid #111; min-height: 24mm; }
                    .brand-name { font-size: 8.5mm; line-height: 1; font-weight: 800; letter-spacing: 0.2px; }
                    .brand-copy { margin-top: 1.2mm; font-size: 3.2mm; font-weight: 600; }
                    .meta-block { display: grid; grid-template-rows: 1fr 1fr; }
                    .meta-row { padding: 2mm; border-bottom: 1px solid #111; }
                    .meta-row:last-child { border-bottom: none; }
                    .meta-row span,
                    .cell span { display: block; font-size: 2.8mm; font-weight: 700; }
                    .meta-row strong,
                    .cell strong { display: block; margin-top: 1.2mm; font-size: 3.1mm; min-height: 4.2mm; font-weight: 700; }
                    .challan-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(12mm, auto); }
                    .cell { padding: 2mm; border-right: 1px solid #111; border-bottom: 1px solid #111; }
                    .cell:nth-child(2n) { border-right: none; }
                    .cell-full { grid-column: 1 / -1; border-right: none; }
                    .cell-full + .cell { border-right: 1px solid #111; }
                    .footer-note { margin-top: 2mm; text-align: center; font-size: 2.6mm; color: #666; }
                    @media print {
                        .print-header { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">${escapeHtml(titleSuffix)}</div>
                <div class="sheet-grid">
                    ${Array.from({ length: 6 }, () => challanMarkup).join('')}
                </div>
                <div class="footer-note">Printed from PK Enterprises ERP</div>
            </body>
        </html>
    `;
}

export { formatCurrency, buildPrintableOrder, getPaymentSummary, buildInvoiceHtml };

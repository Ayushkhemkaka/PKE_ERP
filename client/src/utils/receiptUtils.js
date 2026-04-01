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

const getLogoSource = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/parentLogo.png`;
    }
    return '/parentLogo.png';
};

const formatReceiptDate = (value) => {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).split('T')[0];
    }
    return date.toLocaleDateString('en-CA');
};

const getReceiptYear = (input) => {
    if (input?.id && String(input.id).includes('_')) {
        return String(input.id).split('_')[0];
    }
    if (input?.date) {
        const date = new Date(input.date);
        if (!Number.isNaN(date.getTime())) {
            const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
            return `${year}/${String(year + 1).slice(-2)}`;
        }
    }
    return '';
};

const buildPrintableOrder = (input) => ({
    id: input.id,
    orderType: input.orderType || 'Standard',
    invoiceNumber: `${input.slipNumber ?? ''}`,
    bookNumber: input.bookNumber,
    slipNumber: input.slipNumber,
    year: getReceiptYear(input),
    receiptReference: `Book ${input.bookNumber ?? '-'} / Slip ${input.slipNumber ?? '-'}${getReceiptYear(input) ? ` / ${getReceiptYear(input)}` : ''}`,
    name: input.name,
    site: input.site,
    source: input.source,
    item: input.item,
    quantity: Number(input.quantity || 0),
    gross: Number(input.gross || 0),
    tare: Number(input.tare || 0),
    net: Number(input.net || 0),
    measurementUnit: input.measurementUnit || '',
    showQuantity: String(input.measurementUnit || '').toLowerCase() !== 'tons',
    quantityDisplay: input.quantity ? `${input.quantity} ${input.measurementUnit}` : (input.measurementUnit || 'Pending'),
    rate: input.rate,
    amount: input.amount,
    freight: input.freight,
    total: input.totalAmount,
    date: formatReceiptDate(input.date),
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

const buildChallanMarkup = (order) => {
    const logoSource = getLogoSource();
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
    const inlineField = (label, value) => `<div class="field-line"><span>${label}:</span><strong>${value}</strong></div>`;

    return `
        <div class="challan-card">
            <div class="challan-topline">Railway Gate Pass / Challan</div>
            <div class="challan-header">
                <div class="brand-block">
                    <div class="brand-header-line">
                        <div class="brand-logo-row"><img src="${logoSource}" alt="PK Enterprises" class="brand-logo" /></div>
                        <div class="brand-name">P. K. ENTERPRISES</div>
                    </div>
                    <div class="brand-copy">Harinagar - 845106, Bihar</div>
                    <div class="brand-copy">GSTIN - 10AENPK8366A1ZQ</div>
                </div>
                <div class="meta-block">
                    <div class="meta-row">
                        ${inlineField('Book No.', escapeHtml(order.bookNumber ?? '-'))}
                    </div>
                    <div class="meta-row">
                        ${inlineField('Slip No.', escapeHtml(order.slipNumber ?? '-'))}
                    </div>
                    <div class="meta-row">
                        ${inlineField('Year', escapeHtml(order.year || '-'))}
                    </div>
                    <div class="meta-row">
                        ${inlineField('Date', escapeHtml(order.date))}
                    </div>
                </div>
            </div>
            <div class="challan-grid">
                <div class="cell cell-full">
                    ${inlineField('M/s', escapeHtml(order.name))}
                </div>
                <div class="cell">
                    ${inlineField('GSTN', escapeHtml(order.customerGstin || '-'))}
                </div>
                <div class="cell">
                    ${inlineField('Dly. Point', escapeHtml(order.site || '-'))}
                </div>
                <div class="cell">
                    ${inlineField('Material/Size', escapeHtml(order.item))}
                </div>
                <div class="cell">
                    ${inlineField(quantityPrimaryLabel, quantityPrimaryValue)}
                </div>
                <div class="cell">
                    ${inlineField(quantitySecondaryLabel, quantitySecondaryValue)}
                </div>
                <div class="cell">
                    ${inlineField(quantityTertiaryLabel, quantityTertiaryValue)}
                </div>
                <div class="cell">
                    ${inlineField('Rate', escapeHtml(formatCurrency(order.rate)))}
                </div>
                <div class="cell">
                    ${inlineField('MOD', escapeHtml(order.paymentStatus || '-'))}
                </div>
                <div class="cell">
                    ${inlineField('Amount', escapeHtml(formatCurrency(order.amount)))}
                </div>
                <div class="cell">
                    ${inlineField('FRT', escapeHtml(formatCurrency(order.freight)))}
                </div>
                <div class="cell cell-full">
                    ${inlineField('Vehicle No.', escapeHtml(order.lorryNumber || '-'))}
                </div>
                <div class="cell cell-full">
                    ${inlineField('Remarks', escapeHtml(order.remarks || '-'))}
                </div>
            </div>
        </div>`;
};

const buildInvoiceHtml = (order, titleSuffix) => {
    const challanMarkup = buildChallanMarkup(order);
    return `
        <html>
            <head>
                <title></title>
                <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
                <style>
                    @page { size: A4 portrait; margin: 12mm 11mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: Arial, sans-serif; color: #111; }
                    .print-sheet { width: 100%; display: flex; align-items: flex-start; justify-content: flex-start; }
                    .challan-card { width: 82mm; min-height: 74mm; max-height: 78mm; border: 1px solid #111; display: grid; grid-template-rows: auto auto 1fr; overflow: hidden; }
                    .challan-topline { text-align: center; font-size: 8px; font-weight: 700; padding: 1.2mm 1mm; border-bottom: 1px solid #111; }
                    .challan-header { display: grid; grid-template-columns: 1.35fr 0.65fr; border-bottom: 1px solid #111; }
                    .brand-block { padding: 1mm 1.2mm; border-right: 1px solid #111; min-height: 15mm; }
                    .brand-header-line { display: flex; align-items: center; gap: 0.9mm; }
                    .brand-logo-row { flex: 0 0 auto; }
                    .brand-logo { width: 7.2mm; height: auto; display: block; filter: grayscale(1) contrast(6) brightness(1.75); }
                    .brand-name { font-size: 5.2mm; line-height: 0.9; font-weight: 800; letter-spacing: 0; }
                    .brand-copy { margin-top: 0.35mm; font-size: 2.25mm; font-weight: 600; line-height: 1.05; }
                    .meta-block { display: grid; grid-template-rows: repeat(4, 1fr); }
                    .meta-row { padding: 0.9mm 1.1mm; border-bottom: 1px solid #111; }
                    .meta-row:last-child { border-bottom: none; }
                    .field-line { display: flex; align-items: flex-start; gap: 0.65mm; flex-wrap: wrap; overflow: hidden; }
                    .field-line span { font-size: 2.2mm; font-weight: 700; flex: 0 0 auto; }
                    .field-line strong { font-size: 2.35mm; min-height: 0; font-weight: 700; flex: 1 1 auto; min-width: 0; white-space: normal; overflow-wrap: anywhere; line-height: 1.08; }
                    .challan-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(6.8mm, auto); }
                    .cell { padding: 0.7mm 1mm; border-right: 1px solid #111; border-bottom: 1px solid #111; }
                    .cell:nth-child(2n) { border-right: none; }
                    .cell-full { grid-column: 1 / -1; border-right: none; }
                    .cell-full + .cell { border-right: 1px solid #111; }
                </style>
            </head>
            <body>
                <div class="print-sheet">
                    ${challanMarkup}
                </div>
            </body>
        </html>
    `;
};

const buildMultiInvoiceHtml = (orders, titleSuffix) => {
    const challans = orders.map((order) => buildChallanMarkup(order)).join('');
    return `
        <html>
            <head>
                <title></title>
                <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
                <style>
                    @page { size: A4 portrait; margin: 12mm 11mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: Arial, sans-serif; color: #111; }
                    .print-sheet { width: 100%; display: grid; grid-template-columns: repeat(2, 82mm); gap: 4mm; align-content: start; }
                    .challan-card { width: 82mm; min-height: 74mm; max-height: 78mm; border: 1px solid #111; display: grid; grid-template-rows: auto auto 1fr; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
                    .challan-topline { text-align: center; font-size: 8px; font-weight: 700; padding: 1.2mm 1mm; border-bottom: 1px solid #111; }
                    .challan-header { display: grid; grid-template-columns: 1.35fr 0.65fr; border-bottom: 1px solid #111; }
                    .brand-block { padding: 1mm 1.2mm; border-right: 1px solid #111; min-height: 15mm; }
                    .brand-header-line { display: flex; align-items: center; gap: 0.9mm; }
                    .brand-logo-row { flex: 0 0 auto; }
                    .brand-logo { width: 7.2mm; height: auto; display: block; filter: grayscale(1) contrast(6) brightness(1.75); }
                    .brand-name { font-size: 5.2mm; line-height: 0.9; font-weight: 800; letter-spacing: 0; }
                    .brand-copy { margin-top: 0.35mm; font-size: 2.25mm; font-weight: 600; line-height: 1.05; }
                    .meta-block { display: grid; grid-template-rows: repeat(4, 1fr); }
                    .meta-row { padding: 0.9mm 1.1mm; border-bottom: 1px solid #111; }
                    .meta-row:last-child { border-bottom: none; }
                    .field-line { display: flex; align-items: flex-start; gap: 0.65mm; flex-wrap: wrap; overflow: hidden; }
                    .field-line span { font-size: 2.2mm; font-weight: 700; flex: 0 0 auto; }
                    .field-line strong { font-size: 2.35mm; min-height: 0; font-weight: 700; flex: 1 1 auto; min-width: 0; white-space: normal; overflow-wrap: anywhere; line-height: 1.08; }
                    .challan-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: minmax(6.8mm, auto); }
                    .cell { padding: 0.7mm 1mm; border-right: 1px solid #111; border-bottom: 1px solid #111; }
                    .cell:nth-child(2n) { border-right: none; }
                    .cell-full { grid-column: 1 / -1; border-right: none; }
                    .cell-full + .cell { border-right: 1px solid #111; }
                </style>
            </head>
            <body>
                <div class="print-sheet">${challans}</div>
            </body>
        </html>
    `;
};

export { formatCurrency, buildPrintableOrder, getPaymentSummary, buildInvoiceHtml, buildMultiInvoiceHtml, formatReceiptDate };

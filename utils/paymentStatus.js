const normalizeAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const clampAmount = (value, min, max) => Math.min(Math.max(normalizeAmount(value), min), max);

const buildCashOnsiteState = (totalAmount, cashCredit = 0, existing = {}) => {
    const normalizedTotal = normalizeAmount(totalAmount);
    const normalizedCash = clampAmount(cashCredit, 0, normalizedTotal);
    const normalizedDue = Math.max(normalizedTotal - normalizedCash, 0);
    const needsCollection = normalizedCash > 0;

    return {
        dueAmount: normalizedDue,
        cashCredit: normalizedCash,
        bankCredit: 0,
        needToCollectCash: needsCollection,
        isCollectedCashFromOnsite: needsCollection ? false : Boolean(existing.isCollectedCashFromOnsite)
    };
};

const buildPaymentState = (totalAmount, paymentStatus, existing = {}) => {
    const normalizedTotal = normalizeAmount(totalAmount);
    const normalizedDue = normalizeAmount(existing.dueAmount);
    const normalizedCash = normalizeAmount(existing.cashCredit);
    const normalizedBank = normalizeAmount(existing.bankCredit);

    if (paymentStatus === 'Bank') {
        return {
            dueAmount: 0,
            cashCredit: 0,
            bankCredit: normalizedTotal,
            needToCollectCash: false,
            isCollectedCashFromOnsite: false
        };
    }

    if (paymentStatus === 'Cash') {
        return {
            dueAmount: 0,
            cashCredit: normalizedTotal,
            bankCredit: 0,
            needToCollectCash: false,
            isCollectedCashFromOnsite: false
        };
    }

    if (paymentStatus === 'CashOnsite') {
        const hasExplicitCash = existing.cashCredit !== undefined && existing.cashCredit !== null && existing.cashCredit !== '';
        const onsiteCash = hasExplicitCash ? existing.cashCredit : normalizedTotal;
        return buildCashOnsiteState(normalizedTotal, onsiteCash, existing);
    }

    if (paymentStatus === 'Due') {
        return {
            dueAmount: normalizedTotal,
            cashCredit: 0,
            bankCredit: 0,
            needToCollectCash: false,
            isCollectedCashFromOnsite: false
        };
    }

    if (paymentStatus === 'CashBank') {
        const totalExisting = normalizedDue + normalizedCash + normalizedBank;
        if (totalExisting === 0) {
            return {
                dueAmount: 0,
                cashCredit: 0,
                bankCredit: normalizedTotal,
                needToCollectCash: false,
                isCollectedCashFromOnsite: false
            };
        }

        const safeCash = Math.min(normalizedCash, normalizedTotal);
        const safeBank = Math.min(normalizedBank, Math.max(normalizedTotal - safeCash, 0));
        const safeDue = Math.max(normalizedTotal - safeCash - safeBank, 0);

        return {
            dueAmount: safeDue,
            cashCredit: safeCash,
            bankCredit: safeBank,
            needToCollectCash: false,
            isCollectedCashFromOnsite: false
        };
    }

    return {
        dueAmount: normalizedDue,
        cashCredit: normalizedCash,
        bankCredit: normalizedBank,
        needToCollectCash: Boolean(existing.needToCollectCash),
        isCollectedCashFromOnsite: Boolean(existing.isCollectedCashFromOnsite)
    };
};

const buildCollectedOnsiteState = (order) => {
    const totalAmount = normalizeAmount(order.totalAmount);
    const dueAmount = normalizeAmount(order.dueAmount);
    const dueOnCreate = normalizeAmount(order.due_on_create ?? order.dueOnCreate ?? order.dueAmount);
    const duePaid = normalizeAmount(order.due_paid ?? order.duePaid ?? 0);
    const cashCredit = normalizeAmount(order.cashCredit ?? totalAmount);
    const bankCredit = normalizeAmount(order.bankCredit ?? 0);

    return {
        paymentStatus: 'CashOnsite',
        dueAmount,
        due_on_create: dueOnCreate,
        due_paid: duePaid,
        cashCredit,
        bankCredit,
        needToCollectCash: false,
        isCollectedCashFromOnsite: true
    };
};

export { normalizeAmount, buildPaymentState, buildCashOnsiteState, buildCollectedOnsiteState };

const ORDER_MODES = {
    normal: 'normal',
    b2b: 'b2b',
    all: 'all'
};

const normalizeOrderMode = (value) => {
    if (!value) {
        return ORDER_MODES.normal;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === ORDER_MODES.b2b) {
        return ORDER_MODES.b2b;
    }
    if (normalized === ORDER_MODES.all) {
        return ORDER_MODES.all;
    }
    return ORDER_MODES.normal;
}

const getOrderTableName = (mode) => {
    return 'order_entry';
}

export { ORDER_MODES, normalizeOrderMode, getOrderTableName };

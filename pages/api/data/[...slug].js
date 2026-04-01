import { getAccountSummary } from '../../../controllers/accountSummary.js';
import { getAnalytics } from '../../../controllers/analytics.js';
import { createCustomerAccount, listCustomerAccounts } from '../../../controllers/customerAccounts.js';
import { getDueAccounts, markDueOrderPaid } from '../../../controllers/dueAccounts.js';
import { find, findById } from '../../../controllers/find.js';
import { getOrderHistory } from '../../../controllers/history.js';
import { importOrders } from '../../../controllers/importData.js';
import { createItem, createMeasurementUnit, listItemCatalog, listMeasurementUnits, listRateHistory, updateItemRate, updateItemStatus } from '../../../controllers/items.js';
import { insert, nextSequence } from '../../../controllers/insert.js';
import { listRates, upsertRate } from '../../../controllers/rates.js';
import { listReceipts, markReceiptPrinted } from '../../../controllers/receipts.js';
import { update } from '../../../controllers/update.js';

const handlers = {
  find: {
    GET: find
  },
  export: {
    GET: find
  },
  findById: {
    GET: findById
  },
  insert: {
    POST: insert
  },
  update: {
    POST: update
  },
  nextSequence: {
    GET: nextSequence
  },
  rates: {
    GET: listRates,
    POST: upsertRate
  },
  'items/catalog': {
    GET: listItemCatalog
  },
  items: {
    POST: createItem
  },
  'items/status': {
    POST: updateItemStatus
  },
  'items/history': {
    GET: listRateHistory
  },
  'measurement-units': {
    GET: listMeasurementUnits,
    POST: createMeasurementUnit
  },
  'item-rates': {
    POST: updateItemRate
  },
  import: {
    POST: importOrders
  },
  history: {
    GET: getOrderHistory
  },
  accounts: {
    GET: listCustomerAccounts,
    POST: createCustomerAccount
  },
  'account-summary': {
    GET: getAccountSummary
  },
  'due-accounts': {
    GET: getDueAccounts
  },
  'due-accounts/pay': {
    POST: markDueOrderPaid
  },
  analytics: {
    GET: getAnalytics
  },
  receipts: {
    GET: listReceipts
  },
  'receipts/print': {
    POST: markReceiptPrinted
  }
};

export default async function handler(req, res) {
  const slugParts = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug].filter(Boolean);
  const routeKey = slugParts.join('/');
  const routeHandlers = handlers[routeKey];

  if (!routeHandlers) {
    res.status(404).json({ success: false, message: 'API route not found.' });
    return;
  }

  const methodHandler = routeHandlers[req.method];
  if (!methodHandler) {
    res.status(405).json({ success: false, message: `Method ${req.method} not allowed.` });
    return;
  }

  const nextQuery = { ...req.query };
  delete nextQuery.slug;
  req.query = nextQuery;

  await methodHandler(req, res);
}

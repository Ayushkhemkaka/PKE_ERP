import { Router } from 'express'; 
import { find, findById } from '../controllers/find.js';
import { insert, nextSequence } from '../controllers/insert.js';
import { update } from '../controllers/update.js';
import { listRates, upsertRate } from '../controllers/rates.js';
import { importOrders } from '../controllers/importData.js';
import { getOrderHistory } from '../controllers/history.js';
import { createCustomerAccount, listCustomerAccounts } from '../controllers/customerAccounts.js';
import { getAccountSummary } from '../controllers/accountSummary.js';
import { getAnalytics } from '../controllers/analytics.js';

const dataRouter = Router();

dataRouter.get('/find',find);
dataRouter.post('/insert',insert);
dataRouter.post('/update',update);
dataRouter.get('/findById',findById);
dataRouter.get('/nextSequence', nextSequence);
dataRouter.get('/rates', listRates);
dataRouter.post('/rates', upsertRate);
dataRouter.post('/import', importOrders);
dataRouter.get('/history', getOrderHistory);
dataRouter.get('/export',find);
dataRouter.get('/accounts', listCustomerAccounts);
dataRouter.post('/accounts', createCustomerAccount);
dataRouter.get('/account-summary', getAccountSummary);
dataRouter.get('/analytics', getAnalytics);

export {dataRouter}

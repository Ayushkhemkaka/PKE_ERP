import { Router } from 'express'; 
import { find } from '../controllers/find.js';
import { insert } from '../controllers/insert.js';

const dataRouter = Router();

dataRouter.get('/find',find);
dataRouter.post('/insert',insert);

export {dataRouter}
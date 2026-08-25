import { Router } from 'express';
import * as controller from '../controllers/export.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { objectiveQuerySchema } from '../schemas/objective.schema';

const router = Router();

router.use(validate(objectiveQuerySchema, 'query'));

router.get('/csv', asyncHandler(controller.exportCsv));
router.get('/xlsx', asyncHandler(controller.exportXlsx));
router.get('/pdf', asyncHandler(controller.exportPdf));

export default router;

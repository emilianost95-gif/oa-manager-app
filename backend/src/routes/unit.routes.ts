import { Router } from 'express';
import * as controller from '../controllers/unit.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { unitQuerySchema, unitSchema, unitUpdateSchema } from '../schemas/catalog.schema';
import { idParamSchema, reorderSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', validate(unitQuerySchema, 'query'), asyncHandler(controller.listUnits));
router.post('/', validate(unitSchema), asyncHandler(controller.createUnit));
router.put('/reorder', validate(reorderSchema), asyncHandler(controller.reorderUnits));
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(unitUpdateSchema),
  asyncHandler(controller.updateUnit),
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.deleteUnit));

export default router;

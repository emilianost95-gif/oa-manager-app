import { Router } from 'express';
import * as controller from '../controllers/objective.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  objectiveCreateSchema,
  objectiveQuerySchema,
  objectiveStatusSchema,
  objectiveUpdateSchema,
} from '../schemas/objective.schema';
import { idParamSchema, reorderSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', validate(objectiveQuerySchema, 'query'), asyncHandler(controller.listObjectives));
router.post('/', validate(objectiveCreateSchema), asyncHandler(controller.createObjective));
router.put('/reorder', validate(reorderSchema), asyncHandler(controller.reorderObjectives));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getObjective));
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(objectiveUpdateSchema),
  asyncHandler(controller.updateObjective),
);
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(objectiveStatusSchema),
  asyncHandler(controller.updateObjectiveStatus),
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.deleteObjective));

export default router;

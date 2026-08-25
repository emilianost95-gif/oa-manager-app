import { Router } from 'express';
import * as controller from '../controllers/subject.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { subjectSchema, subjectUpdateSchema } from '../schemas/catalog.schema';
import { idParamSchema, reorderSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', asyncHandler(controller.listSubjects));
router.post('/', validate(subjectSchema), asyncHandler(controller.createSubject));
router.put('/reorder', validate(reorderSchema), asyncHandler(controller.reorderSubjects));
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getSubjectDetail),
);
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(subjectUpdateSchema),
  asyncHandler(controller.updateSubject),
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.deleteSubject));

export default router;

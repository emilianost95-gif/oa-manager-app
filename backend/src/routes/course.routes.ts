import { Router } from 'express';
import * as controller from '../controllers/course.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { courseSchema, courseUpdateSchema } from '../schemas/catalog.schema';
import { idParamSchema, reorderSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', asyncHandler(controller.listCourses));
router.post('/', validate(courseSchema), asyncHandler(controller.createCourse));
router.put('/reorder', validate(reorderSchema), asyncHandler(controller.reorderCourses));
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(courseUpdateSchema),
  asyncHandler(controller.updateCourse),
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.deleteCourse));

export default router;

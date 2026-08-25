import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', asyncHandler(controller.logout));
router.get('/me', requireAuth, asyncHandler(controller.me));
router.put(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(controller.updateProfile),
);
router.put(
  '/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
);

export default router;

import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyResetTokenSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', asyncHandler(controller.logout));

// Recuperación de contraseña (públicas). El token viaja en el cuerpo y no en
// la URL, para que no quede escrito en los logs de acceso del servidor.
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(controller.forgotPassword),
);
router.post(
  '/reset-password/verify',
  validate(verifyResetTokenSchema),
  asyncHandler(controller.verifyResetToken),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPassword),
);
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

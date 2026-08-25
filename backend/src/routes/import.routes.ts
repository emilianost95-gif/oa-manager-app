import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/import.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { badRequest } from '../lib/errors';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(csv|xlsx|xlsm)$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(badRequest('Solo se aceptan archivos .csv o .xlsx'));
  },
});

const router = Router();

router.get('/template', controller.downloadTemplate);
router.post('/preview', upload.single('file'), asyncHandler(controller.previewImport));
router.post(
  '/confirm',
  validate(controller.importConfirmSchema),
  asyncHandler(controller.confirmImport),
);

export default router;

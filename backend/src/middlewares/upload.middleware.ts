import multer from 'multer';
import path from 'path';
import { ValidationError } from '../utils/errors.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    // Check extension and mimetype
    if (ext !== '.csv' || (mime !== 'text/csv' && mime !== 'application/vnd.ms-excel')) {
      return cb(new ValidationError('Only CSV files (.csv) are allowed.'));
    }

    cb(null, true);
  },
});

import { Router } from 'express';
import { ImportController } from '../controllers/import.controller.js';
import { OpenAIProvider } from '../providers/openai.provider.js';
import { CSVService } from '../services/csv.service.js';
import { ValidationService } from '../services/validation.service.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Instantiate dependencies
const llmProvider = new OpenAIProvider();
const csvService = new CSVService();
const validationService = new ValidationService();

// Instantiate controller with injected dependencies
const importController = new ImportController(llmProvider, csvService, validationService);

// Bind multipart file uploader and controller execution handler
router.post('/', upload.single('file'), importController.importCSV);

export default router;

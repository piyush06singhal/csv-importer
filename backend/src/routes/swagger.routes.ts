import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const router = Router();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GrowEasy CSV CRM Importer API Documentation',
      version: '1.0.0',
      description:
        'Interactive API reference documentation for the AI-Powered CSV CRM Importer full-stack backend service.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Retrieve application environment status',
          description:
            'Retrieves diagnostics detailing Node runtime environment versions, server memory metrics, system uptime logs, and OpenAI API configuration status.',
          responses: {
            200: {
              description: 'Application diagnostics checklist payload.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      version: { type: 'string', example: '1.0.0' },
                      timestamp: { type: 'string', format: 'date-time' },
                      node_version: { type: 'string', example: 'v20.10.0' },
                      uptime_seconds: { type: 'number', example: 145.23 },
                      memory: {
                        type: 'object',
                        properties: {
                          heap_used_mb: { type: 'number', example: 34.25 },
                          heap_total_mb: { type: 'number', example: 87.4 },
                        },
                      },
                      services: {
                        type: 'object',
                        properties: {
                          openai_api: { type: 'string', example: 'configured' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/import': {
        post: {
          summary: 'Import, parse, and map raw CSV leads through AI pipelines',
          description:
            'Ingests a multipart-form CSV file payload, segments rows into batches of 25, runs semantic LLM extractions, validates Zod schemas, and returns consolidated JSON objects.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'CSV file to upload and parse.',
                    },
                  },
                  required: ['file'],
                },
              },
            },
          },
          responses: {
            200: {
              description:
                'Successfully processed import result or line-delimited JSON status logs.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      metadata: {
                        type: 'object',
                        properties: {
                          total_records: { type: 'integer', example: 50 },
                          imported_records: { type: 'integer', example: 42 },
                          skipped_records: { type: 'integer', example: 8 },
                          processing_time_ms: { type: 'integer', example: 2450 },
                          batch_count: { type: 'integer', example: 2 },
                        },
                      },
                      records: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      skipped: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Malformed files or file parameter missing validations.',
            },
            500: {
              description: 'Downstream AI engine or server failures.',
            },
          },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs));

export default router;
export { specs };

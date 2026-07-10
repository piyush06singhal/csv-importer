import { LLMProvider, LLMResult } from './llm.provider.js';
import { PromptBuilder } from '../prompts/prompt-builder.js';
import { logger } from '../utils/logger.js';
import { AIProviderError } from '../utils/errors.js';
import OpenAI from 'openai';
import { env } from '../config/env.config.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private promptBuilder: PromptBuilder;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.promptBuilder = new PromptBuilder();
  }

  async mapColumns(rows: Record<string, string>[], headers: string[]): Promise<LLMResult> {
    logger.info(`OpenAIProvider: Starting AI column mapping for a batch of ${rows.length} rows.`);

    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildUserPrompt(rows, headers);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for highly deterministic schema mapping
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'crm_mapping_response',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                records: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: ['string', 'null'] },
                      email: { type: ['string', 'null'] },
                      country_code: { type: ['string', 'null'] },
                      mobile_without_country_code: { type: ['string', 'null'] },
                      company: { type: ['string', 'null'] },
                      city: { type: ['string', 'null'] },
                      state: { type: ['string', 'null'] },
                      country: { type: ['string', 'null'] },
                      lead_owner: { type: ['string', 'null'] },
                      crm_status: { type: ['string', 'null'] },
                      crm_note: { type: ['string', 'null'] },
                      data_source: { type: ['string', 'null'] },
                      possession_time: { type: ['string', 'null'] },
                      description: { type: ['string', 'null'] },
                    },
                    required: [
                      'name',
                      'email',
                      'country_code',
                      'mobile_without_country_code',
                      'company',
                      'city',
                      'state',
                      'country',
                      'lead_owner',
                      'crm_status',
                      'crm_note',
                      'data_source',
                      'possession_time',
                      'description',
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ['records'],
              additionalProperties: false,
            },
          },
        },
      });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new AIProviderError('OpenAI response was completely empty.', 502);
      }

      logger.debug('OpenAIProvider: Successfully received response content from OpenAI.');
      const parsedData = JSON.parse(responseText);

      if (!parsedData || !Array.isArray(parsedData.records)) {
        throw new AIProviderError(
          'OpenAI structured response is missing the records array.',
          502
        );
      }

      return {
        records: parsedData.records,
      };
    } catch (error: any) {
      logger.error(`OpenAIProvider: Error communicating with OpenAI API: ${error.message}`);
      if (error instanceof AIProviderError) {
        throw error;
      }
      // Return a structured AIProviderError carrying the downstream status if possible
      const statusCode = error.status || 502;
      throw new AIProviderError(
        `Failed to retrieve structural mappings from OpenAI: ${error.message}`,
        statusCode
      );
    }
  }
}

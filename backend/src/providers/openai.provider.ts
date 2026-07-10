import { LLMProvider, LLMResult } from './llm.provider.js';
import { PromptBuilder } from '../prompts/prompt-builder.js';
import { logger } from '../utils/logger.js';
import { AIProviderError } from '../utils/errors.js';
import OpenAI from 'openai';
import { env } from '../config/env.config.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private promptBuilder: PromptBuilder;
  private isGroq = false;

  constructor() {
    const apiKey = env.OPENAI_API_KEY;
    // Auto-detect Groq keys (starts with gsk_)
    this.isGroq = apiKey.startsWith('gsk_');

    if (this.isGroq) {
      logger.info('OpenAIProvider: Groq API Key detected. Initializing Groq client context.');
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    } else {
      logger.info('OpenAIProvider: OpenAI API Key detected. Initializing standard OpenAI client.');
      this.client = new OpenAI({
        apiKey,
      });
    }
    this.promptBuilder = new PromptBuilder();
  }

  async mapColumns(rows: Record<string, string>[], headers: string[]): Promise<LLMResult> {
    logger.info(
      `OpenAIProvider: Starting AI column mapping using ${
        this.isGroq ? 'Groq' : 'OpenAI'
      } for a batch of ${rows.length} rows.`
    );

    let systemPrompt = this.promptBuilder.buildSystemPrompt();
    if (this.isGroq) {
      // Groq JSON mode requires explicit instructions about the JSON structure
      systemPrompt += `\n\nCRITICAL: You MUST return a valid JSON object. The JSON object must contain a single top-level key "records", which maps to an array of objects. Each object in the array must map to the CRM target schema: name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description. All fields are required to be present as keys; use null for unmapped fields. Do NOT return any markdown wrapping (e.g. \`\`\`json) or conversational text.`;
    }

    const userPrompt = this.promptBuilder.buildUserPrompt(rows, headers);

    try {
      const modelName = this.isGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

      const chatParams: any = {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for highly deterministic schema mapping
      };

      if (this.isGroq) {
        chatParams.response_format = { type: 'json_object' };
      } else {
        chatParams.response_format = {
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
        };
      }

      const response = await this.client.chat.completions.create(chatParams);
      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new AIProviderError(
          `${this.isGroq ? 'Groq' : 'OpenAI'} response was completely empty.`,
          502
        );
      }

      logger.debug('OpenAIProvider: Successfully received response content.');
      const parsedData = JSON.parse(responseText);

      if (!parsedData || !Array.isArray(parsedData.records)) {
        throw new AIProviderError(
          `AI structured response is missing the records array. Received: ${responseText.substring(0, 100)}`,
          502
        );
      }

      return {
        records: parsedData.records,
      };
    } catch (error: any) {
      logger.error(`OpenAIProvider: Error communicating with AI: ${error.message}`);
      if (error instanceof AIProviderError) {
        throw error;
      }
      // Return a structured AIProviderError carrying the downstream status if possible
      const statusCode = error.status || 502;
      throw new AIProviderError(
        `Failed to retrieve structural mappings from AI: ${error.message}`,
        statusCode
      );
    }
  }
}

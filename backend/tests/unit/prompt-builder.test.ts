import { PromptBuilder } from '../../src/prompts/prompt-builder.js';

describe('PromptBuilder Unit Tests', () => {
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
  });

  it('should build a detailed system prompt containing target schema field references', () => {
    const systemPrompt = promptBuilder.buildSystemPrompt();

    expect(systemPrompt).toContain('GOOD_LEAD_FOLLOW_UP');
    expect(systemPrompt).toContain('leads_on_demand');
    expect(systemPrompt).toContain('possession_time');
    expect(systemPrompt).toContain('mobile_without_country_code');
  });

  it('should build a stringified user prompt containing headers and rows', () => {
    const headers = ['Client Name', 'Client Mail'];
    const rows = [{ 'Client Name': 'Bruce', 'Client Mail': 'bruce@wayne.com' }];

    const userPrompt = promptBuilder.buildUserPrompt(rows, headers);
    const parsed = JSON.parse(userPrompt);

    expect(parsed.raw_csv_headers).toEqual(headers);
    expect(parsed.batch_records).toEqual(rows);
  });
});

import type { AiCoachPayload, AiCoachReview } from '../domain/aiCoach';

const OPENAI_MODEL = 'gpt-5.4-mini';

export async function fetchAiCoachReview(payload: AiCoachPayload, apiKey: string): Promise<AiCoachReview> {
  if (!apiKey.trim()) {
    throw new Error('Add an OpenAI API key before running the AI coach.');
  }

  const requestBody = buildOpenAIRequest(payload);
  const response = await sendOpenAIRequest(requestBody, apiKey);
  return parseCoachReviewResponse(response);
}

function buildOpenAIRequest(payload: AiCoachPayload) {
  return {
    model: OPENAI_MODEL,
    instructions: [
      'You are a direct trading review coach for Solana meme coin trades.',
      'Use only the trade facts provided. Do not invent prices, market cap, wallet data, or token details.',
      'Give practical process feedback. Do not provide financial advice, price predictions, or buy/sell calls.',
      'Keep wording concise and specific to the trader behavior.'
    ].join(' '),
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Review this trade session JSON and return only the requested structured JSON:\n${JSON.stringify(payload)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'trade_coach_review',
        strict: true,
        schema: coachReviewSchema
      }
    }
  };
}

async function sendOpenAIRequest(requestBody: ReturnType<typeof buildOpenAIRequest>, apiKey: string) {
  if (window.__TRADE_REVIEWER_OPENAI_REQUEST__) {
    return window.__TRADE_REVIEWER_OPENAI_REQUEST__(requestBody);
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(openAIErrorMessage(data, response.status));
  }

  return data;
}

function parseCoachReviewResponse(response: unknown): AiCoachReview {
  if (isErrorResponse(response)) {
    throw new Error(response.error);
  }

  const text = outputText(response);
  if (!text) {
    throw new Error('OpenAI returned an empty coach review.');
  }

  const parsed = JSON.parse(text) as AiCoachReview;
  validateCoachReview(parsed);
  return parsed;
}

function outputText(response: unknown) {
  if (isRecord(response) && typeof response.output_text === 'string') {
    return response.output_text;
  }

  if (!isRecord(response) || !Array.isArray(response.output)) return '';

  return response.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => {
      if (!isRecord(content)) return '';
      if (typeof content.text === 'string') return content.text;
      if (typeof content.output_text === 'string') return content.output_text;
      return '';
    })
    .join('');
}

function validateCoachReview(review: AiCoachReview) {
  const fields: Array<keyof AiCoachReview> = [
    'headline',
    'summary',
    'strengths',
    'mistakes',
    'patterns',
    'nextTradeRule',
    'riskWarnings'
  ];

  for (const field of fields) {
    if (!(field in review)) {
      throw new Error('OpenAI returned an incomplete coach review.');
    }
  }
}

function openAIErrorMessage(data: unknown, status: number) {
  if (isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string') {
    return data.error.message;
  }

  return `OpenAI request failed with status ${status}`;
}

function isErrorResponse(value: unknown): value is { error: string } {
  return isRecord(value) && typeof value.error === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const coachReviewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'summary', 'strengths', 'mistakes', 'patterns', 'nextTradeRule', 'riskWarnings'],
  properties: {
    headline: { type: 'string' },
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'string' }
    },
    mistakes: {
      type: 'array',
      items: { type: 'string' }
    },
    patterns: {
      type: 'array',
      items: { type: 'string' }
    },
    nextTradeRule: { type: 'string' },
    riskWarnings: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

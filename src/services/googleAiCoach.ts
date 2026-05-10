import type { AiCoachPayload, AiCoachReview } from '../domain/aiCoach';

const GOOGLE_AI_MODEL = 'gemini-2.5-flash';

export async function fetchAiCoachReview(payload: AiCoachPayload, apiKey: string): Promise<AiCoachReview> {
  if (!apiKey.trim()) {
    throw new Error('Add a Google AI API key before running the AI coach.');
  }

  const requestBody = buildGoogleAiRequest(payload);
  const response = await sendGoogleAiRequest(requestBody, apiKey);
  return parseCoachReviewResponse(response);
}

function buildGoogleAiRequest(payload: AiCoachPayload) {
  return {
    systemInstruction: {
      parts: [
        {
          text: [
            'You are a direct trading review coach for Solana meme coin trades.',
            'Use only the trade facts provided. Do not invent prices, market cap, wallet data, or token details.',
            'Give practical process feedback. Do not provide financial advice, price predictions, or buy/sell calls.',
            'Keep wording concise and specific to the trader behavior.'
          ].join(' ')
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Review this trade session JSON and return only the requested structured JSON:\n${JSON.stringify(payload)}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: coachReviewSchema
    }
  };
}

async function sendGoogleAiRequest(requestBody: ReturnType<typeof buildGoogleAiRequest>, apiKey: string) {
  if (window.__TRADE_REVIEWER_GOOGLE_AI_REQUEST__) {
    return window.__TRADE_REVIEWER_GOOGLE_AI_REQUEST__(requestBody);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_AI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(requestBody)
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(googleAiErrorMessage(data, response.status));
  }

  return data;
}

function parseCoachReviewResponse(response: unknown): AiCoachReview {
  if (isErrorResponse(response)) {
    throw new Error(response.error);
  }

  const text = outputText(response);
  if (!text) {
    throw new Error('Google AI returned an empty coach review.');
  }

  const parsed = JSON.parse(text) as AiCoachReview;
  validateCoachReview(parsed);
  return parsed;
}

function outputText(response: unknown) {
  if (isRecord(response) && typeof response.output_text === 'string') {
    return response.output_text;
  }

  if (!isRecord(response) || !Array.isArray(response.candidates)) return '';

  return response.candidates
    .flatMap((candidate) => {
      if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
        return [];
      }

      return candidate.content.parts;
    })
    .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
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
      throw new Error('Google AI returned an incomplete coach review.');
    }
  }
}

function googleAiErrorMessage(data: unknown, status: number) {
  if (isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string') {
    return data.error.message;
  }

  return `Google AI request failed with status ${status}`;
}

function isErrorResponse(value: unknown): value is { error: string } {
  return isRecord(value) && typeof value.error === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const coachReviewSchema = {
  type: 'OBJECT',
  required: ['headline', 'summary', 'strengths', 'mistakes', 'patterns', 'nextTradeRule', 'riskWarnings'],
  properties: {
    headline: { type: 'STRING' },
    summary: { type: 'STRING' },
    strengths: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    mistakes: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    patterns: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    nextTradeRule: { type: 'STRING' },
    riskWarnings: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    }
  }
};

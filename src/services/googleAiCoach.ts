import type { AiCoachPayload, AiCoachReview } from '../domain/aiCoach';

const GOOGLE_AI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT = [
  'You are a direct trading review coach for Solana meme coin trades.',
  'Use only the trade facts provided. Do not invent prices, market cap, wallet data, or token details.',
  'Give practical process feedback. Do not provide financial advice, price predictions, or buy/sell calls.',
  'Keep wording concise and specific to the trader behavior.'
].join(' ');

interface AiCoachApiKeys {
  googleAiApiKey: string;
  groqApiKey: string;
}

export async function fetchAiCoachReview(payload: AiCoachPayload, apiKeys: AiCoachApiKeys): Promise<AiCoachReview> {
  if (!apiKeys.googleAiApiKey.trim()) {
    throw new Error('Add a Google AI API key before running the AI coach.');
  }

  try {
    const response = await sendGoogleAiRequest(buildGoogleAiRequest(payload), apiKeys.googleAiApiKey);
    return parseCoachReviewResponse(response, 'Google AI');
  } catch (caught) {
    if (!isLimitError(caught)) {
      throw caught;
    }

    if (!apiKeys.groqApiKey.trim()) {
      throw new Error('Google AI hit a limit. Add a Groq API key to use the fallback coach.');
    }

    const response = await sendGroqRequest(buildGroqRequest(payload), apiKeys.groqApiKey);
    return parseCoachReviewResponse(response, 'Groq');
  }
}

function buildGoogleAiRequest(payload: AiCoachPayload) {
  return {
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT
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

function buildGroqRequest(payload: AiCoachPayload) {
  return {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Review this trade session JSON and return only valid JSON with this exact shape: ${JSON.stringify(coachReviewShape)}\n${JSON.stringify(payload)}`
      }
    ],
    temperature: 0.2,
    max_completion_tokens: 1200,
    response_format: { type: 'json_object' }
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
    throw new AiProviderError(googleAiErrorMessage(data, response.status), response.status);
  }

  return data;
}

async function sendGroqRequest(requestBody: ReturnType<typeof buildGroqRequest>, apiKey: string) {
  if (window.__TRADE_REVIEWER_GROQ_REQUEST__) {
    return window.__TRADE_REVIEWER_GROQ_REQUEST__(requestBody);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new AiProviderError(groqErrorMessage(data, response.status), response.status);
  }

  return data;
}

function parseCoachReviewResponse(response: unknown, providerName: string): AiCoachReview {
  if (isErrorResponse(response)) {
    throw new Error(response.error);
  }

  const text = outputText(response);
  if (!text) {
    throw new Error(`${providerName} returned an empty coach review.`);
  }

  const parsed = JSON.parse(text.trim()) as AiCoachReview;
  validateCoachReview(parsed, providerName);
  return parsed;
}

function outputText(response: unknown) {
  if (isRecord(response) && typeof response.output_text === 'string') {
    return response.output_text;
  }

  if (!isRecord(response)) return '';

  const googleParts = Array.isArray(response.candidates)
    ? response.candidates.flatMap((candidate) => {
        if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
          return [];
        }

        return candidate.content.parts;
      })
    : [];

  return googleParts
    .concat(groqOutputParts(response))
    .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
    .join('');
}

function groqOutputParts(response: unknown) {
  if (!isRecord(response) || !Array.isArray(response.choices)) return [];

  return response.choices.map((choice) => {
    if (!isRecord(choice) || !isRecord(choice.message) || typeof choice.message.content !== 'string') {
      return {};
    }

    return { text: choice.message.content };
  });
}

function validateCoachReview(review: AiCoachReview, providerName: string) {
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
      throw new Error(`${providerName} returned an incomplete coach review.`);
    }
  }
}

function googleAiErrorMessage(data: unknown, status: number) {
  if (isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string') {
    return data.error.message;
  }

  return `Google AI request failed with status ${status}`;
}

function groqErrorMessage(data: unknown, status: number) {
  if (isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string') {
    return data.error.message;
  }

  return `Groq request failed with status ${status}`;
}

function isLimitError(value: unknown) {
  if (value instanceof AiProviderError && value.statusCode === 429) {
    return true;
  }

  if (isRecord(value) && value.statusCode === 429) {
    return true;
  }

  const message = value instanceof Error ? value.message : '';
  return /rate limit|quota|too many requests|resource exhausted/i.test(message);
}

function isErrorResponse(value: unknown): value is { error: string } {
  return isRecord(value) && typeof value.error === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

class AiProviderError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

const coachReviewShape = {
  headline: 'string',
  summary: 'string',
  strengths: ['string'],
  mistakes: ['string'],
  patterns: ['string'],
  nextTradeRule: 'string',
  riskWarnings: ['string']
};

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

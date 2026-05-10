/// <reference types="vite/client" />

interface Window {
  __TRADE_REVIEWER_API_KEY__?: string;
  __TRADE_REVIEWER_GOOGLE_AI_API_KEY__?: string;
  __TRADE_REVIEWER_GOOGLE_AI_REQUEST__?: (payload: unknown) => Promise<unknown>;
  __TRADE_REVIEWER_GROQ_API_KEY__?: string;
  __TRADE_REVIEWER_GROQ_REQUEST__?: (payload: unknown) => Promise<unknown>;
  webkit?: {
    messageHandlers?: {
      tradeReviewerStorage?: {
        postMessage: (message: unknown) => void;
      };
      tradeReviewerGoogleAI?: {
        postMessage: (message: unknown) => void;
      };
      tradeReviewerGroq?: {
        postMessage: (message: unknown) => void;
      };
    };
  };
}

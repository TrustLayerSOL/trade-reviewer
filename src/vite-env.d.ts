/// <reference types="vite/client" />

interface Window {
  __TRADE_REVIEWER_API_KEY__?: string;
  __TRADE_REVIEWER_OPENAI_API_KEY__?: string;
  __TRADE_REVIEWER_OPENAI_REQUEST__?: (payload: unknown) => Promise<unknown>;
  webkit?: {
    messageHandlers?: {
      tradeReviewerStorage?: {
        postMessage: (message: unknown) => void;
      };
      tradeReviewerOpenAI?: {
        postMessage: (message: unknown) => void;
      };
    };
  };
}

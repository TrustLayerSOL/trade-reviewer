/// <reference types="vite/client" />

interface Window {
  __TRADE_REVIEWER_API_KEY__?: string;
  webkit?: {
    messageHandlers?: {
      tradeReviewerStorage?: {
        postMessage: (message: unknown) => void;
      };
    };
  };
}

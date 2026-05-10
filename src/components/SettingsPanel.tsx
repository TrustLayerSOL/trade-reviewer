import { KeyRound, Wallet } from 'lucide-react';

interface SettingsPanelProps {
  walletAddress: string;
  heliusApiKey: string;
  googleAiApiKey: string;
  groqApiKey: string;
  onWalletAddressChange: (value: string) => void;
  onHeliusApiKeyChange: (value: string) => void;
  onGoogleAiApiKeyChange: (value: string) => void;
  onGroqApiKeyChange: (value: string) => void;
}

export function SettingsPanel({
  walletAddress,
  heliusApiKey,
  googleAiApiKey,
  groqApiKey,
  onWalletAddressChange,
  onHeliusApiKeyChange,
  onGoogleAiApiKeyChange,
  onGroqApiKeyChange
}: SettingsPanelProps) {
  return (
    <section className="panel settings-panel" aria-label="Wallet settings">
      <label>
        <span>
          <Wallet size={16} />
          Wallet
        </span>
        <input value={walletAddress} onChange={(event) => onWalletAddressChange(event.target.value)} />
      </label>
      <label>
        <span>
          <KeyRound size={16} />
          Helius key
        </span>
        <input
          value={heliusApiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => onHeliusApiKeyChange(event.target.value)}
        />
      </label>
      <label>
        <span>
          <KeyRound size={16} />
          Google AI key
        </span>
        <input
          value={googleAiApiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => onGoogleAiApiKeyChange(event.target.value)}
        />
      </label>
      <label>
        <span>
          <KeyRound size={16} />
          Groq key
        </span>
        <input
          value={groqApiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => onGroqApiKeyChange(event.target.value)}
        />
      </label>
    </section>
  );
}

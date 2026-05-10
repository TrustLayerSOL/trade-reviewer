import { KeyRound, Wallet } from 'lucide-react';

interface SettingsPanelProps {
  walletAddress: string;
  heliusApiKey: string;
  openAiApiKey: string;
  onWalletAddressChange: (value: string) => void;
  onHeliusApiKeyChange: (value: string) => void;
  onOpenAiApiKeyChange: (value: string) => void;
}

export function SettingsPanel({
  walletAddress,
  heliusApiKey,
  openAiApiKey,
  onWalletAddressChange,
  onHeliusApiKeyChange,
  onOpenAiApiKeyChange
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
          OpenAI key
        </span>
        <input
          value={openAiApiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => onOpenAiApiKeyChange(event.target.value)}
        />
      </label>
    </section>
  );
}

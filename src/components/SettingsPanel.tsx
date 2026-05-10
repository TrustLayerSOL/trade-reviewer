import { KeyRound, Wallet } from 'lucide-react';

interface SettingsPanelProps {
  walletAddress: string;
  apiKey: string;
  onWalletAddressChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
}

export function SettingsPanel({
  walletAddress,
  apiKey,
  onWalletAddressChange,
  onApiKeyChange
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
          value={apiKey}
          type="password"
          autoComplete="off"
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
      </label>
    </section>
  );
}

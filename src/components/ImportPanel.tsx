import { FileInput, RefreshCw, Sparkles } from 'lucide-react';

interface ImportPanelProps {
  loading: boolean;
  onLoadSample: () => void;
  onFetchWallet: () => void;
  onImportCsv: (csv: string) => void;
}

export function ImportPanel({ loading, onLoadSample, onFetchWallet, onImportCsv }: ImportPanelProps) {
  return (
    <section className="panel import-panel" aria-label="Trade import">
      <div className="button-row">
        <button type="button" onClick={onFetchWallet} disabled={loading}>
          <RefreshCw size={17} />
          {loading ? 'Fetching' : 'Fetch wallet'}
        </button>
        <button type="button" onClick={onLoadSample}>
          <Sparkles size={17} />
          Sample
        </button>
      </div>
      <label className="file-label">
        <FileInput size={17} />
        Import CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) onImportCsv(await file.text());
            event.currentTarget.value = '';
          }}
        />
      </label>
    </section>
  );
}

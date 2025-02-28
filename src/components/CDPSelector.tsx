import { CDP } from '@/lib/types/cdp';
import { Select } from './ui/Select';

interface CDPSelectorProps {
  selectedCDP: CDP | null;
  onSelect: (cdp: CDP | null) => void;
}

export default function CDPSelector({ selectedCDP, onSelect }: CDPSelectorProps) {
  const cdpOptions = [
    { value: '', label: 'All CDPs' },
    { value: 'SEGMENT', label: 'Segment' },
    { value: 'MPARTICLE', label: 'mParticle' },
    { value: 'LYTICS', label: 'Lytics' },
    { value: 'ZEOTAP', label: 'Zeotap' },
  ];

  return (
    <div className="mb-4">
      <Select
        label="Select CDP Platform"
        options={cdpOptions}
        value={selectedCDP || ''}
        onChange={(e) => onSelect(e.target.value as CDP || null)}
      />
    </div>
  );
}
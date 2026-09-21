'use client';

import { useState } from 'react';

import CreateStudio from './CreateStudio';
import PresetGrid from './PresetGrid';

export default function CreateFlow() {
  const [step, setStep] = useState('presets');
  const [selectedPreset, setSelectedPreset] = useState(null);

  if (step === 'presets') {
    return (
      <PresetGrid
        onSelect={preset => {
          setSelectedPreset(preset);
          setStep('studio');
        }}
      />
    );
  }

  return (
    <CreateStudio
      preset={selectedPreset}
      onBack={() => {
        setSelectedPreset(null);
        setStep('presets');
      }}
    />
  );
}

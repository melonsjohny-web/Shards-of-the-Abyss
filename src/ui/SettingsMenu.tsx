import { useGameStore, GameState } from '../stores/useGameStore';
import { useState, useEffect } from 'react';

export function SettingsMenu() {
  const { setGameState } = useGameStore();

  const [fov, setFov] = useState(85);
  const [sensitivity, setSensitivity] = useState(1);
  const [shadows, setShadows] = useState('high');

  useEffect(() => {
    const saved = localStorage.getItem('shards_settings');
    if (saved) {
      const s = JSON.parse(saved);
      if (s.fov) setFov(s.fov);
      if (s.sensitivity) setSensitivity(s.sensitivity);
      if (s.shadows) setShadows(s.shadows);
    }
  }, []);

  const saveAndExit = () => {
    localStorage.setItem('shards_settings', JSON.stringify({ fov, sensitivity, shadows }));
    // We update window globals or stores if we want real-time change
    (window as any).__FOV = fov;
    (window as any).__SENSITIVITY = sensitivity;
    (window as any).__SHADOWS = shadows;
    setGameState(GameState.MAIN_MENU);
  };

  return (
    <div className="absolute inset-0 z-50 bg-neutral-900 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] flex items-center justify-center p-8">
      
      <div className="w-full max-w-2xl bg-black/80 border border-amber-900/50 p-8 shadow-2xl flex flex-col h-[600px]">
        <h2 className="text-3xl text-amber-500 font-serif tracking-widest text-center border-b border-amber-900/50 pb-4 mb-6">
          SETTINGS
        </h2>

        <div className="flex flex-col gap-6 flex-1 px-8">
          <div>
            <label className="block text-amber-100 font-serif mb-2">Field of View (FOV): {fov}</label>
            <input 
              type="range" min="60" max="120" step="1" 
              value={fov} onChange={e => setFov(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-amber-100 font-serif mb-2">Mouse Sensitivity: {sensitivity.toFixed(1)}</label>
            <input 
              type="range" min="0.1" max="5.0" step="0.1" 
              value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>

          <div>
            <label className="block text-amber-100 font-serif mb-2">Shadow Quality</label>
            <div className="flex gap-4">
              {['none', 'low', 'high'].map(q => (
                <button 
                  key={q}
                  onClick={() => setShadows(q)}
                  className={`flex-1 py-2 font-serif uppercase tracking-widest border transition-all ${
                    shadows === q ? 'bg-amber-900/50 border-amber-500 text-amber-100' : 'border-neutral-700 text-neutral-500 hover:border-amber-700/50 hover:text-neutral-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-auto">
          <button
            onClick={() => setGameState(GameState.MAIN_MENU)}
            className="px-8 py-3 bg-neutral-900 border border-neutral-700 text-neutral-300 font-serif tracking-widest hover:bg-neutral-800 transition-colors uppercase"
          >
            Cancel
          </button>
          <button
            onClick={saveAndExit}
            className="px-8 py-3 bg-amber-900 border border-amber-600 font-serif tracking-widest text-amber-100 hover:bg-amber-800 transition-colors uppercase shadow-[0_0_15px_rgba(217,119,6,0.2)]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

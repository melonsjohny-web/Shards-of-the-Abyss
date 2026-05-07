import { useGameStore, GameState } from '../stores/useGameStore';

export function DialogUI() {
  const { gameState, currentDialog, advanceDialog } = useGameStore();

  if (gameState !== GameState.DIALOGUE || !currentDialog) return null;

  const node = currentDialog.nodes[currentDialog.currentNode];
  if (!node) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 pointer-events-auto bg-black/20">
      <div className="w-full max-w-4xl bg-neutral-900/95 border-2 border-amber-900/50 rounded-sm shadow-2xl p-6 flex gap-6">
        
        {/* NPC Portrait placeholder */}
        <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-sm shrink-0 flex items-center justify-center">
          <span className="text-4xl">🧑‍🦳</span>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-amber-500 font-serif text-xl mb-2 font-bold tracking-wide">{currentDialog.npcName}</h3>
            <p className="text-neutral-200 font-serif text-lg leading-relaxed">{node.text}</p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {node.options.map((opt, i) => (
              <button
                key={i}
                className="text-left w-full px-4 py-2 hover:bg-white/10 text-amber-100/80 hover:text-white transition-colors font-serif border border-transparent hover:border-white/20 rounded cursor-pointer"
                onClick={() => {
                  opt.action?.();
                  advanceDialog(opt.next);
                }}
              >
                <span className="text-amber-700 mr-2">{i + 1}.</span> {opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

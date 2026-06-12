import React, { useEffect, useRef, useState } from 'react';
import { ControlRoom } from './components/ControlRoom';
import { SimulationLoop } from './engine/SimulationLoop';

import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const simRef = useRef<SimulationLoop>(new SimulationLoop());
  const [simState, setSimState] = useState(simRef.current.getState());
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      simRef.current.update(0.016); // 60 FPS
      setSimState(simRef.current.getState());
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {showWelcome && <WelcomeModal onStart={() => setShowWelcome(false)} />}
      <ControlRoom
        trains={simState.trains}
        stations={simState.stations}
        alarms={simState.alarms}
        logs={simState.logs}
        anomalies={simState.game.anomalies}
        game={simState.game}
        onEmergencyTrigger={() => simRef.current.triggerEmergency()}
        onPurchaseUpgrade={(id, cost) => {
          if (simRef.current.gameManager.budget >= cost) {
            simRef.current.gameManager.applyPenalty(cost); // Deduct cost
            // Apply upgrade logic here (e.g., modify physics params)
            console.log(`Purchased upgrade: ${id}`);
          }
        }}
        onScenarioTrigger={(scenario) => {
          simRef.current.setScenario(scenario as any);
        }}
        onResolveAnomaly={(id) => {
          simRef.current.gameManager.resolveAnomaly(id);
        }}
        onSetStrategy={(strategy) => {
          simRef.current.gameManager.setMaintenanceStrategy(strategy as any);
        }}
      />
    </div>
  );
}

export default App;

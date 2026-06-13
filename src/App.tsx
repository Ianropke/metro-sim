import React, { useEffect, useState } from 'react';
import { ControlRoom } from './components/ControlRoom';
import { SimulationLoop } from './engine/SimulationLoop';
import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const [sim] = useState(() => new SimulationLoop());
  const [simState, setSimState] = useState(() => sim.getState());
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      sim.update(0.016); // 60 FPS
      setSimState(sim.getState());
    }, 16);

    return () => clearInterval(interval);
  }, [sim]);

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
        onEmergencyTrigger={() => sim.triggerEmergency()}
        onPurchaseUpgrade={(id, cost) => {
          sim.gameManager.purchaseUpgrade(id, cost);
        }}
        onScenarioTrigger={(scenario) => {
          sim.setScenario(scenario as 'DEFAULT' | 'MORNING_RUSH');
        }}
        onResolveAnomaly={(id) => {
          sim.gameManager.resolveAnomaly(id);
        }}
        onSetStrategy={(strategy) => {
          sim.gameManager.setMaintenanceStrategy(strategy as 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE');
        }}
        onSetManualOverride={(trainId, isManual) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train) {
            train.isManualOverride = isManual;
            train.manualThrottle = 0;
            train.manualBrake = 0;
            if (isManual) {
              train.stateMachine.transitionTo('RESTRICTED_MANUAL');
            } else {
              train.stateMachine.transitionTo('AUTO_DRIVE');
            }
          }
        }}
        onSetManualCommands={(trainId, throttle, brake) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train) {
            train.manualThrottle = throttle;
            train.manualBrake = brake;
          }
        }}
      />
    </div>
  );
}

export default App;

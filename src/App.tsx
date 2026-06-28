import React, { useEffect, useState } from 'react';
import { ControlRoom } from './components/ControlRoom';
import { SimulationLoop } from './engine/SimulationLoop';
import { WelcomeModal } from './components/WelcomeModal';
import { EndGameModal } from './components/EndGameModal';
import { MilestonePopup } from './components/MilestonePopup';

function App() {
  const [sim, setSim] = useState(() => new SimulationLoop());
  const [simState, setSimState] = useState(() => sim.getState());
  const [showWelcome, setShowWelcome] = useState(true);

  const handleRestart = () => {
    const newSim = new SimulationLoop();
    setSim(newSim);
    setSimState(newSim.getState());
  };

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      // Calculate delta time in seconds, capped at 0.1s to prevent huge jumps if tab is inactive
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      
      // Stop ticking if game is over
      if (sim.gameManager.gameStatus === 'PLAYING') {
        const timeScale = sim.gameManager.timeScale ?? 2;
        let speedMultiplier = 10;
        if (timeScale === 0) speedMultiplier = 0;
        else if (timeScale === 1) speedMultiplier = 5;
        else if (timeScale === 2) speedMultiplier = 10;
        else if (timeScale === 3) speedMultiplier = 20;

        sim.tick(dt, speedMultiplier);
      }
      setSimState(sim.getState());

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [sim]);

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {showWelcome && <WelcomeModal onStart={() => setShowWelcome(false)} />}
      
      {simState.game.gameStatus !== 'PLAYING' && (
        <EndGameModal 
          status={simState.game.gameStatus as 'GAME_OVER' | 'VICTORY'}
          totalPassengers={simState.game.totalPassengersTransported || 0}
          satisfaction={simState.game.satisfaction || 0}
          budget={simState.game.budget || 0}
          onRestart={handleRestart}
        />
      )}

      {simState.game.activeMilestonePopup && (
        <MilestonePopup
          name={simState.game.activeMilestonePopup.name}
          reward={simState.game.activeMilestonePopup.reward}
          description={simState.game.activeMilestonePopup.description}
          onDismiss={() => sim.gameManager.dismissMilestonePopup()}
        />
      )}


      <ControlRoom
        trains={simState.trains}
        stations={simState.stations}
        alarms={simState.alarms}
        logs={simState.logs}
        anomalies={simState.game.anomalies}
        game={simState.game}
        fleet={simState.fleet}
        onSetTimeScale={(scale) => {
          sim.gameManager.timeScale = scale;
        }}
        onEmergencyTrigger={() => sim.triggerEmergency()}
        onBroadcastAnnouncement={() => {
          sim.gameManager.broadcastAnnouncement();
        }}
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
          sim.gameManager.setMaintenanceStrategy(strategy as 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE');
        }}
        onStartResearch={(strategy, cost) => {
          sim.gameManager.startResearch(strategy, cost);
        }}
        onSetManualOverride={(trainId, isManual) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train) {
            train.isManualOverride = isManual;
            train.manualThrottle = 0;
            train.manualBrake = 0;
            train.isEmergencyBrake = false; // Reset emergency brake on manual override toggle
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
        onDeployTrain={(trainId) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train && train.stateMachine.currentState === 'DEPOT' && sim.gameManager.budget >= 500) {
            const isSpawnBlocked = sim.trains.some(t => t.stateMachine.currentState !== 'DEPOT' && t.physics.position < 300);
            if (!isSpawnBlocked) {
              sim.gameManager.applyPenalty(500); // Cost to deploy
              train.stateMachine.transitionTo('AUTO_DRIVE');
              // Assuming it's already at 0, direction 1.
            }
          }
        }}
        onReturnToDepot={(trainId) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train) {
            train.isReturningToDepot = true;
            if (train.stateMachine.currentState !== 'DWELL') {
              train.stateMachine.transitionTo('TO_DEPOT');
            }
          }
        }}
        onResetEmergency={(trainId) => {
          const train = sim.trains.find(t => t.id === trainId);
          if (train) {
            train.isEmergencyBrake = false;
            train.stateMachine.transitionTo('AUTO_DRIVE');
          }
        }}
        onPerformTrainMaintenance={(trainId) => {
          sim.gameManager.performTrainMaintenance(trainId);
        }}
        onPerformTrackMaintenance={() => {
          sim.gameManager.performTrackMaintenance();
        }}
        onStartTicketInspection={() => {
          sim.gameManager.startTicketInspection();
        }}
        onStartDataAudit={() => {
          sim.gameManager.startDataAudit();
        }}
      />
    </div>
  );
}

export default App;

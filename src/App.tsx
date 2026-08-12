import React, { useEffect, useRef, useState } from 'react';
import { ControlRoom } from './components/ControlRoom';
import { SimulationLoop } from './engine/SimulationLoop';
import { WelcomeModal } from './components/WelcomeModal';
import { EndGameModal } from './components/EndGameModal';
import { MilestonePopup } from './components/MilestonePopup';
import { OPERATING_COSTS } from './engine/GameConfig';

function App() {
  const [sim, setSim] = useState(() => new SimulationLoop());
  const simRef = useRef(sim);
  const [simState, setSimState] = useState(() => sim.getState());
  const [showWelcome, setShowWelcome] = useState(true);

  const handleRestart = () => {
    const newSim = new SimulationLoop();
    simRef.current = newSim;
    setSim(newSim);
    setSimState(newSim.getState());
  };

  useEffect(() => {
    const currentSim = simRef.current;
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      // Calculate delta time in seconds, capped at 0.1s to prevent huge jumps if tab is inactive
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      
      // Stop ticking if game is over
      if (currentSim.gameManager.gameStatus === 'PLAYING') {
        const timeScale = currentSim.gameManager.timeScale ?? 2;
        let speedMultiplier = 10;
        if (timeScale === 0) speedMultiplier = 0;
        else if (timeScale === 1) speedMultiplier = 5;
        else if (timeScale === 2) speedMultiplier = 10;
        else if (timeScale === 3) speedMultiplier = 20;

        currentSim.tick(dt, speedMultiplier);
      }
      setSimState(currentSim.getState());

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
          onDismiss={() => simRef.current.gameManager.dismissMilestonePopup()}
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
          simRef.current.gameManager.timeScale = scale;
        }}
        onEmergencyTrigger={() => simRef.current.triggerEmergency()}
        onBroadcastAnnouncement={() => {
          simRef.current.gameManager.broadcastAnnouncement();
        }}
        onPurchaseUpgrade={(id, cost) => {
          simRef.current.gameManager.purchaseUpgrade(id, cost);
        }}
        onResolveAnomaly={(id) => {
          simRef.current.gameManager.resolveAnomaly(id);
        }}
        onSetStrategy={(strategy) => {
          simRef.current.gameManager.setMaintenanceStrategy(strategy as 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE');
        }}
        onStartResearch={(strategy, cost) => {
          simRef.current.gameManager.startResearch(strategy, cost);
        }}
        onSetManualOverride={(trainId, isManual) => {
          const train = simRef.current.trains.find(t => t.id === trainId);
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
          const train = simRef.current.trains.find(t => t.id === trainId);
          if (train) {
            train.manualThrottle = throttle;
            train.manualBrake = brake;
          }
        }}
        onDeployTrain={(trainId) => {
          const train = simRef.current.trains.find(t => t.id === trainId);
          if (train && train.stateMachine.currentState === 'DEPOT' && simRef.current.gameManager.budget >= OPERATING_COSTS.trainDeployment) {
            const isSpawnBlocked = simRef.current.trains.some(t => t.stateMachine.currentState !== 'DEPOT' && t.physics.position < 300);
            if (!isSpawnBlocked) {
              simRef.current.gameManager.applyPenalty(OPERATING_COSTS.trainDeployment);
              train.stateMachine.transitionTo('AUTO_DRIVE');
              // Assuming it's already at 0, direction 1.
            }
          }
        }}
        onReturnToDepot={(trainId) => {
          const train = simRef.current.trains.find(t => t.id === trainId);
          if (train) {
            train.isReturningToDepot = true;
            if (train.stateMachine.currentState !== 'DWELL') {
              train.stateMachine.transitionTo('TO_DEPOT');
            }
          }
        }}
        onResetEmergency={(trainId) => {
          const train = simRef.current.trains.find(t => t.id === trainId);
          if (train) {
            train.isEmergencyBrake = false;
            train.stateMachine.transitionTo('AUTO_DRIVE');
          }
        }}
        onPerformTrainMaintenance={(trainId) => {
          simRef.current.gameManager.performTrainMaintenance(trainId);
        }}
        onPerformTrackMaintenance={() => {
          simRef.current.gameManager.performTrackMaintenance();
        }}
        onStartTicketInspection={() => {
          simRef.current.gameManager.startTicketInspection();
        }}
        onStartDataAudit={() => {
          simRef.current.gameManager.startDataAudit();
        }}
      />
    </div>
  );
}

export default App;

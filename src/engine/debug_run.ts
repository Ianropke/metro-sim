import { SimulationLoop } from './SimulationLoop';

function runDebugPlaythrough() {
    const loop = new SimulationLoop();
    let ticks = 0;
    const maxTicks = 200;
    
    console.log("Running debug playthrough to analyze satisfaction decay...");

    while (loop.gameManager.gameStatus === 'PLAYING' && ticks < maxTicks) {
        const gm = loop.gameManager;
        const budget = gm.budget;
        
        // 1. Handle tutorial steps
        if (gm.tutorialStep === 1) {
            const doorAnom = gm.anomalies.find(a => a.component === 'Doors' && a.failed);
            if (doorAnom && !doorAnom.stewardDeployed) {
                gm.resolveAnomaly(doorAnom.id);
            }
        } else if (gm.tutorialStep === 2) {
            if (budget >= 8000) {
                gm.purchaseUpgrade('BUY_TRAIN', 8000);
            }
        }
        
        // 2. Normal game logic (Step 3+)
        if (gm.tutorialStep >= 3) {
            // Deploy trains from DEPOT if possible
            const depotTrain = loop.trains.find(t => t.stateMachine.currentState === 'DEPOT');
            if (depotTrain && budget >= 500) {
                const isSpawnBlocked = loop.trains.some(t => t.stateMachine.currentState !== 'DEPOT' && t.physics.position < 300);
                if (!isSpawnBlocked) {
                    gm.applyPenalty(500);
                    depotTrain.stateMachine.transitionTo('AUTO_DRIVE');
                }
            }
            
            // Auto Steward Call
            if (!gm.autoStewardCall && budget >= 500) {
                gm.purchaseUpgrade('AUTO_STEWARD_CALL', 500);
            }
            // Start research
            const hasPrev = gm.unlockedStrategies.has('PREVENTIVE');
            const isPrevRes = gm.activeResearch === 'PREVENTIVE';
            if (!hasPrev && !isPrevRes && !gm.activeResearch && budget >= 2000) {
                gm.startResearch('PREVENTIVE', 1000);
            }
        }
        
        loop.tick(0.1, 60);
        ticks++;
        
        const waiting = loop.stations.reduce((acc, s) => acc + s.passengerCount, 0);
        const hvacFailedCount = gm.anomalies.filter(a => a.component === 'HVAC' && a.failed).length;
        console.log(`[Tick ${ticks}] Sat: ${gm.passengerSatisfaction.toFixed(1)}%, Budget: $${Math.round(gm.budget)}, Waiting: ${waiting}, HVAC failed: ${hvacFailedCount}, Anoms: ${gm.anomalies.map(a => `${a.component}(f:${a.failed},sev:${a.severity.toFixed(2)})`).join(', ')}`);
        
        loop.trains.forEach(t => {
            console.log(`    Train ${t.id}: Pos: ${Math.round(t.physics.position)}m, State: ${t.stateMachine.currentState}, Pax: ${t.passengerCount}/${t.maxCapacity}, Dir: ${t.direction}`);
        });
    }
    console.log(`Final Status: ${loop.gameManager.gameStatus}`);
}

runDebugPlaythrough();

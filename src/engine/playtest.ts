import { SimulationLoop } from './SimulationLoop';

function runPlaythrough(runId: number) {
    const loop = new SimulationLoop();
    
    let ticks = 0;
    const maxTicks = 30000; // Limit ticks to prevent infinite loops (approx 50 hours of game time)
    
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
            // Auto Steward Call is number one priority!
            if (!gm.autoStewardCall && budget >= 500) {
                gm.purchaseUpgrade('AUTO_STEWARD_CALL', 500);
            }
            
            // If we don't have auto steward call, manually resolve failed anomalies
            if (!gm.autoStewardCall) {
                const failedAnom = gm.anomalies.find(a => a.failed && !a.stewardDeployed);
                if (failedAnom) {
                    const availableStewards = gm.stewardsCount - gm.stewardsBusy;
                    if (availableStewards > 0) {
                        gm.resolveAnomaly(failedAnom.id);
                    }
                }
            }
            
            // Broadcast announcement if there is a failed anomaly to keep passenger satisfaction decay low
            const hasUnresolvedFailure = gm.anomalies.some(a => a.failed);
            if (hasUnresolvedFailure && !gm.isAnnouncementActive && budget >= 100) {
                gm.broadcastAnnouncement();
            }

            // Research Strategy Progression
            const hasPrev = gm.unlockedStrategies.has('PREVENTIVE');
            const isPrevRes = gm.activeResearch === 'PREVENTIVE';
            if (!hasPrev && !isPrevRes && !gm.activeResearch && budget >= 1200) {
                gm.startResearch('PREVENTIVE', 1000);
            }
            if (hasPrev && gm.maintenanceStrategy === 'REACTIVE') {
                gm.setMaintenanceStrategy('PREVENTIVE');
            }
            
            // Hire Data Analysts (up to 3) if researching
            if (gm.activeResearch && gm.dataAnalystsCount < 3 && budget >= 2500) {
                gm.purchaseUpgrade('HIRE_ANALYST', 1500);
            }
            
            // CONDITIONAL Research
            const hasCond = gm.unlockedStrategies.has('CONDITIONAL');
            const isCondRes = gm.activeResearch === 'CONDITIONAL';
            if (hasPrev && !hasCond && !isCondRes && !gm.activeResearch && budget >= 4000) {
                gm.startResearch('CONDITIONAL', 2500);
            }
            if (hasCond && gm.maintenanceStrategy === 'PREVENTIVE') {
                gm.setMaintenanceStrategy('CONDITIONAL');
            }
            
            // Upgrade sensors under CONDITIONAL
            if (gm.maintenanceStrategy === 'CONDITIONAL' && gm.sensorLevel < 3 && budget >= 3000) {
                gm.purchaseUpgrade('SENSOR_UPGRADE', 2000);
            }
            
            // PREDICTIVE Research
            const hasPred = gm.unlockedStrategies.has('PREDICTIVE');
            const isPredRes = gm.activeResearch === 'PREDICTIVE';
            if (hasCond && !hasPred && !isPredRes && !gm.activeResearch && budget >= 7500) {
                gm.startResearch('PREDICTIVE', 5000);
            }
            if (hasPred && gm.maintenanceStrategy === 'CONDITIONAL') {
                gm.setMaintenanceStrategy('PREDICTIVE');
            }
            
            // Buy TRES and ARIIS
            if (!gm.hasTRES && budget >= 6000) {
                gm.purchaseUpgrade('BUY_TRES', 4000);
            }
            if (!gm.hasARIIS && budget >= 6000) {
                gm.purchaseUpgrade('BUY_ARIIS', 3500);
            }
            
            // Buy automated PIDS
            if (!gm.automatedPIDS && budget >= 4000) {
                gm.purchaseUpgrade('AUTOMATED_PIDS', 2000);
            }
            
            // Steward training
            if (gm.stewardTrainingLevel < 3 && budget >= 4500) {
                gm.purchaseUpgrade('TRAIN_STEWARDS', 2500);
            }
            if (!gm.stewardSpecialTraining && budget >= 5000) {
                gm.purchaseUpgrade('STEWARD_SPECIAL_TRAINING', 3000);
            }
            
            // Buy more trains to increase capacity if we have high budget
            if (loop.trains.length < 5 && budget >= 11000) {
                gm.purchaseUpgrade('BUY_TRAIN', 8000);
            }
            
            // Deploy trains from DEPOT if possible
            const depotTrain = loop.trains.find(t => t.stateMachine.currentState === 'DEPOT');
            if (depotTrain && budget >= 500) {
                const isSpawnBlocked = loop.trains.some(t => t.stateMachine.currentState !== 'DEPOT' && t.physics.position < 300);
                if (!isSpawnBlocked) {
                    gm.applyPenalty(500);
                    depotTrain.stateMachine.transitionTo('AUTO_DRIVE');
                }
            }
            
            // Buy Route Extension 1 (Win condition!)
            if (!gm.activeUpgrades.has('ROUTE_EXTENSION_1') && budget >= 16000) {
                gm.purchaseUpgrade('ROUTE_EXTENSION_1', 15000);
            }
            
            // Early repair of anomalies if we can see them
            const visibleAnom = gm.anomalies.find(a => a.detected && !a.failed);
            if (visibleAnom) {
                const repairCost = visibleAnom.failed ? 800 : (gm.maintenanceStrategy === 'PREDICTIVE' ? 100 : (gm.maintenanceStrategy === 'CONDITIONAL' ? 250 : 300));
                if (budget >= repairCost) {
                    gm.resolveAnomaly(visibleAnom.id);
                }
            }
        }
        
        // Tick: 0.1 real seconds, speedMultiplier = 60 => 6 game seconds per tick
        loop.tick(0.1, 60);
        ticks++;
    }
    
    return {
        runId,
        status: loop.gameManager.gameStatus,
        durationMinutes: (ticks * 6) / 60,
        finalBudget: loop.gameManager.budget,
        finalSatisfaction: loop.gameManager.passengerSatisfaction,
        totalPassengers: loop.gameManager.totalPassengersTransported,
        trainsCount: loop.trains.length,
        maintenanceStrategy: loop.gameManager.maintenanceStrategy
    };
}

function runAllPlaytests() {
    console.log("=== STARTING AUTOMATED BALANCE PLAYTEST (20 RUNS) ===");
    const results = [];
    let victories = 0;
    let defeats = 0;
    
    for (let i = 1; i <= 20; i++) {
        const res = runPlaythrough(i);
        results.push(res);
        if (res.status === 'VICTORY') victories++;
        else defeats++;
        
        console.log(`Run #${i.toString().padStart(2, '0')}: Status: ${res.status.padEnd(9)}, Budget: $${Math.round(res.finalBudget).toString().padStart(6)}, Pax: ${res.totalPassengers.toString().padStart(4)}, Strategy: ${res.maintenanceStrategy}`);
    }
    
    console.log("\n=== PLAYTEST SIMULATION SUMMARY ===");
    console.log(`Total Runs: 20`);
    console.log(`Victories:  ${victories} (${(victories/20 * 100).toFixed(0)}%)`);
    console.log(`Defeats:    ${defeats} (${(defeats/20 * 100).toFixed(0)}%)`);
    
    const avgDuration = results.reduce((acc, r) => acc + r.durationMinutes, 0) / 20;
    const avgBudget = results.reduce((acc, r) => acc + r.finalBudget, 0) / 20;
    const avgPax = results.reduce((acc, r) => acc + r.totalPassengers, 0) / 20;
    const avgTrains = results.reduce((acc, r) => acc + r.trainsCount, 0) / 20;
    
    console.log(`Avg Game Duration: ${(avgDuration / 60).toFixed(1)} game hours (${Math.round(avgDuration)} game minutes)`);
    console.log(`Avg Final Budget:  $${Math.round(avgBudget)}`);
    console.log(`Avg Passengers:    ${Math.round(avgPax)}`);
    console.log(`Avg Train Count:   ${avgTrains.toFixed(1)}`);
    
    console.log("\n=== BALANCE EVALUATION ===");
    if (victories / 20 >= 0.7) {
        console.log("🟢 BALANCE STATUS: OPTIMAL.");
        console.log("Spillet er udfordrende, men fuldt ud muligt at gennemføre med den rette strategi.");
    } else if (victories / 20 > 0.3) {
        console.log("🟡 BALANCE STATUS: KRÆVENDE.");
        console.log("Spillet har en høj sværhedsgrad, hvilket passer godt til en strategisk simulation.");
    } else {
        console.log("🔴 BALANCE STATUS: FOR SVÆRT.");
        console.log("Det anbefales at reducere opgraderingspriser eller øge passagerindtægter.");
    }
}

runAllPlaytests();

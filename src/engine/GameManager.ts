export class GameManager {
    public passengerSatisfaction: number = 100.0; // 0-100%
    public energyEfficiency: number = 100.0; // 0-100%
    public totalPassengersTransported: number = 0;
    public tutorialStep: number = 0; // 0: Start, 1: Break, 2: Fixed/Shop, 3: Full unlock
    public dataLakeSavings: number = 0; // Cumulative savings from predictive maintenance

    // Economy
    public budget: number = 10000; // Starting budget
    public ticketPrice: number = 10.00; // $ per passenger
    public energyCostPerKWh: number = 0.15; // $ per kWh

    // Staff & Passenger Info System
    public stewardsCount: number = 1;
    public stewardsBusy: number = 0;
    public stewardTrainingLevel: number = 1; // 1: Basic, 2: Certified, 3: Expert
    public automatedPIDS: boolean = false;
    public isAnnouncementActive: boolean = false;
    public announcementTimer: number = 0.0;
    public resolvedTrainIds: string[] = []; // Teleports reset signals to SimulationLoop

    // R&D & Strategic Upgrades
    public sensorLevel: number = 1; // 1, 2, 3
    public dataAnalystsCount: number = 0;
    public hasARIIS: boolean = false;
    public hasTRES: boolean = false;
    public stewardSpecialTraining: boolean = false;
    public autoStewardCall: boolean = false;
    public unlockedStrategies: Set<string> = new Set(['REACTIVE']);
    public activeResearch: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE' | null = null;
    public researchProgress: number = 0.0;
    public researchDuration: number = 0.0;
    public researchTimeRemaining: number = 0.0;

    // Time
    public timeOfDay: number = 5 * 3600; // Starts at 05:00 in seconds
    public timeSpeedMultiplier: number = 60; // 1 real second = 60 game seconds (1 minute)

    // Config
    private readonly SATISFACTION_DECAY_PER_WAITING_PAX = 0.001; // % per second per pax
    private readonly ENERGY_PENALTY_PER_KWH = 0.05; // % per kWh used

    // Active Upgrades Set
    public activeUpgrades: Set<string> = new Set();

    public purchaseUpgrade(id: string, cost: number): boolean {
        if (this.budget >= cost) {
            if (id === 'BUY_TRAIN') {
                this.budget -= cost;
                this.activeUpgrades.add(id);
                if (this.tutorialStep === 2) this.tutorialStep = 3;
                return true;
            }
            if (id === 'HIRE_STEWARD') {
                this.budget -= cost;
                this.stewardsCount += 1;
                return true;
            }
            if (id === 'TRAIN_STEWARDS') {
                this.budget -= cost;
                this.stewardTrainingLevel = Math.min(3, this.stewardTrainingLevel + 1);
                return true;
            }
            if (id === 'AUTOMATED_PIDS') {
                this.budget -= cost;
                this.automatedPIDS = true;
                this.activeUpgrades.add(id); // track it
                return true;
            }
            if (id === 'SENSOR_UPGRADE') {
                this.budget -= cost;
                this.sensorLevel = Math.min(3, this.sensorLevel + 1);
                return true;
            }
            if (id === 'HIRE_ANALYST') {
                this.budget -= cost;
                this.dataAnalystsCount += 1;
                return true;
            }
            if (id === 'BUY_ARIIS') {
                this.budget -= cost;
                this.hasARIIS = true;
                this.activeUpgrades.add(id);
                return true;
            }
            if (id === 'BUY_TRES') {
                this.budget -= cost;
                this.hasTRES = true;
                this.activeUpgrades.add(id);
                return true;
            }
            if (id === 'STEWARD_SPECIAL_TRAINING') {
                this.budget -= cost;
                this.stewardSpecialTraining = true;
                this.activeUpgrades.add(id);
                return true;
            }
            if (id === 'AUTO_STEWARD_CALL') {
                this.budget -= cost;
                this.autoStewardCall = true;
                this.activeUpgrades.add(id);
                return true;
            }
            if (!this.activeUpgrades.has(id)) {
                this.budget -= cost;
                this.activeUpgrades.add(id);
                return true;
            }
        }
        return false;
    }

    public update(dt: number, waitingPax: number, energyUsedKWh: number) {
        // Update Time (dt is already in game-seconds)
        this.timeOfDay += dt;
        if (this.timeOfDay >= 24 * 3600) {
            this.timeOfDay -= 24 * 3600; // loop to midnight
        }

        // Elapsed game minutes in this tick
        const gameMinutes = dt / 60;

        // Steward salaries ($50 per game-hour per steward = 0.83 per game-minute)
        const salaries = this.stewardsCount * 0.83 * gameMinutes;
        this.budget -= salaries;

        // Data Analyst salaries ($80 per game-hour per analyst = 1.33 per game-minute)
        const analystWages = this.dataAnalystsCount * 1.33 * gameMinutes;
        this.budget -= analystWages;

        // Active Strategy Cost (per game-hour)
        let strategyRate = 0;
        if (this.maintenanceStrategy === 'PREVENTIVE') strategyRate = 400;
        else if (this.maintenanceStrategy === 'CONDITIONAL') strategyRate = 600;
        else if (this.maintenanceStrategy === 'PREDICTIVE') strategyRate = 800;
        this.budget -= strategyRate * (gameMinutes / 60); // rate per hour, so divide gameMinutes by 60 to get hours

        // Update active research progress (real-time seconds)
        if (this.activeResearch) {
            const speed = 1.0 + this.dataAnalystsCount * 0.3;
            const realDt = dt / this.timeSpeedMultiplier;
            this.researchProgress += realDt * speed;
            this.researchTimeRemaining = Math.max(0, this.researchDuration - this.researchProgress);
            
            if (this.researchProgress >= this.researchDuration) {
                this.unlockedStrategies.add(this.activeResearch);
                this.triggerEvent('INFO', `Forskning fuldført: Du har nu låst op for ${this.activeResearch} vedligeholdelse!`, 'FORSKNING');
                this.activeResearch = null;
                this.researchProgress = 0;
            }
        }

        // Announcement timer countdown
        if (this.isAnnouncementActive) {
            this.announcementTimer -= dt;
            if (this.announcementTimer <= 0) {
                this.isAnnouncementActive = false;
                this.announcementTimer = 0;
            }
        }

        // 1. Update Satisfaction
        // Decay based on people waiting
        let decayFactor = 1.0;
        if (this.isAnnouncementActive) {
            decayFactor *= 0.25; // 75% reduction during active announcement
        } else if (this.automatedPIDS) {
            decayFactor *= 0.50; // 50% reduction from automated PIDS
        }

        // Check if there is a steward on any broken train to calm passengers locally
        const hasStewardWorking = this.anomalies.some(a => a.failed && a.stewardDeployed && (a.stewardTravelTime ?? 0) <= 0);
        if (hasStewardWorking) {
            decayFactor *= 0.80; // 20% additional reduction
        }

        const decay = waitingPax * this.SATISFACTION_DECAY_PER_WAITING_PAX * dt * decayFactor;
        this.passengerSatisfaction = Math.max(0, this.passengerSatisfaction - decay);

        // 2. Update Energy Efficiency & Cost
        this.energyEfficiency = Math.min(100, Math.max(0, this.energyEfficiency - (energyUsedKWh * this.ENERGY_PENALTY_PER_KWH)));

        // Deduct Energy Cost
        const energyCost = energyUsedKWh * this.energyCostPerKWh;
        this.budget -= energyCost;
    }

    public broadcastAnnouncement(): boolean {
        // Broadcast delay details. Costs $50.
        if (this.budget >= 50) {
            this.budget -= 50;
            this.isAnnouncementActive = true;
            this.announcementTimer = 15.0; // 15 game-seconds of broadcast duration
            this.triggerEvent('INFO', 'Højtalerudkald: Passagerer informeres om forsinkelsen. Tilfredsheden falder langsommere!', 'INFO');
            return true;
        }
        return false;
    }

    public moneyPopups: { id: string, amount: number, x: number, timestamp: number }[] = [];

    public addScore(paxCount: number, positionX?: number) {
        this.totalPassengersTransported += paxCount;
        this.passengerSatisfaction = Math.min(100, this.passengerSatisfaction + (paxCount * 0.1));

        // Add Ticket Revenue
        const revenue = paxCount * this.ticketPrice;
        this.budget += revenue;

        if (positionX !== undefined && revenue > 0) {
            this.moneyPopups.push({
                id: `POP_${Date.now()}_${Math.random()}`,
                amount: revenue,
                x: positionX,
                timestamp: Date.now()
            });
            setTimeout(() => {
                this.moneyPopups = this.moneyPopups.filter(p => Date.now() - p.timestamp < 2000);
            }, 2100);
        }
    }

    public applyPenalty(amount: number) {
        this.budget -= amount;
    }

    // Event System
    public activeEvents: { id: string, name: string, description: string, type: 'DELAY' | 'FAILURE' | 'INFO', timestamp: number }[] = [];

    public checkForEvents(dt: number) {
        // Simple random event generator
        // 0.2% chance per second of an event (reduced from 1%)
        // ARIIS reduces random events by 60%
        let chance = 0.002;
        if (this.hasARIIS) {
            chance *= 0.4;
        }
        if (Math.random() < chance * dt) {
            this.triggerRandomEvent();
        }
    }

    private triggerRandomEvent() {
        const events = [
            { name: 'Passenger Holding Doors', description: 'Train delayed at station.', type: 'DELAY' },
            { name: 'Signal Glitch', description: 'Brief loss of communication.', type: 'FAILURE' },
            { name: 'VIP Transport', description: 'Bonus revenue for smooth ride.', type: 'INFO' }
        ] as const;

        const event = events[Math.floor(Math.random() * events.length)];
        const id = `EVT_${Date.now()}`;

        this.activeEvents.push({
            id,
            name: event.name,
            description: event.description,
            type: event.type,
            timestamp: Date.now()
        });

        setTimeout(() => {
            this.activeEvents = this.activeEvents.filter(e => e.id !== id);
        }, 5000);
    }

    private triggerEvent(type: 'DELAY' | 'FAILURE' | 'INFO', description: string, name?: string) {
        const id = `EVT_${Date.now()}`;
        this.activeEvents.push({
            id,
            name: name || type,
            description,
            type,
            timestamp: Date.now()
        });

        setTimeout(() => {
            this.activeEvents = this.activeEvents.filter(e => e.id !== id);
        }, 5000);
    }

    // Game State
    public gameStatus: 'PLAYING' | 'GAME_OVER' | 'VICTORY' = 'PLAYING';

    // Predictive Maintenance / Anomaly Detection
    public anomalies: { 
        id: string, 
        trainId: string, 
        component: string, 
        severity: number, 
        detected: boolean, 
        failed?: boolean, 
        timeSinceFailure?: number,
        stewardDeployed?: boolean,
        stewardTravelTime?: number,
        stewardRepairTime?: number
    }[] = [];
    public maintenanceStrategy: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE' = 'REACTIVE';

    public setMaintenanceStrategy(strategy: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE') {
        if (this.unlockedStrategies.has(strategy)) {
            this.maintenanceStrategy = strategy;
        }
    }

    public startResearch(strategy: 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE', cost: number): boolean {
        if (this.budget >= cost && !this.activeResearch && !this.unlockedStrategies.has(strategy)) {
            this.budget -= cost;
            this.activeResearch = strategy;
            this.researchProgress = 0.0;
            this.researchDuration = strategy === 'PREVENTIVE' ? 60.0 : strategy === 'CONDITIONAL' ? 120.0 : 180.0;
            this.researchTimeRemaining = this.researchDuration;
            this.triggerEvent('INFO', `Forskning startet: Implementering af ${strategy} vedligeholdelse.`, 'FORSKNING');
            return true;
        }
        return false;
    }

    public checkForAnomalies(dt: number, trains: { id: string }[]) {
        // --- TUTORIAL LOGIC ---
        if (this.tutorialStep === 0) {
            if (this.totalPassengersTransported > 0) {
                this.tutorialStep = 1;
            }
        }

        if (this.tutorialStep === 1) {
            // Force an anomaly on TRN01 to teach the player
            if (this.anomalies.length === 0) {
                const trn01 = trains.find(t => t.id === 'TRN01');
                if (trn01) {
                    this.anomalies.push({
                        id: `ANOM_TUTORIAL`,
                        trainId: 'TRN01',
                        component: 'Doors',
                        severity: 1.0, // Instantly failed
                        detected: true,
                        failed: true,
                        timeSinceFailure: 0
                    });
                    this.triggerEvent('FAILURE', `Kritisk fejl: Doors på TRN01. Send en Steward afsted i DATA dashboardet under 'Gold Layer' for at reparere det!`, 'TUTORIAL');
                }
            }
        }
        // --- END TUTORIAL LOGIC ---

        // Scan and update anomaly detection status dynamically based on strategy & equipment
        this.anomalies.forEach(anom => {
            if (this.maintenanceStrategy === 'PREDICTIVE') {
                anom.detected = true;
            } else if (this.maintenanceStrategy === 'CONDITIONAL') {
                const threshold = this.sensorLevel === 1 ? 0.6 : this.sensorLevel === 2 ? 0.4 : 0.2;
                if (anom.severity >= threshold) {
                    anom.detected = true;
                }
            } else if (this.maintenanceStrategy === 'REACTIVE') {
                if (this.hasTRES) {
                    if (anom.severity >= 0.5) {
                        anom.detected = true;
                    }
                } else {
                    anom.detected = anom.failed ? true : false;
                }
            } else { // PREVENTIVE
                anom.detected = anom.failed ? true : false;
            }
        });

        // Auto Steward Dispatch if upgrade is active
        if (this.autoStewardCall) {
            this.anomalies.forEach(anom => {
                if (anom.failed && !anom.stewardDeployed) {
                    this.deploySteward(anom.id);
                }
            });
        }

        // Update Steward timers
        this.anomalies.forEach(anom => {
            if (anom.stewardDeployed) {
                if (anom.stewardTravelTime !== undefined && anom.stewardTravelTime > 0) {
                    anom.stewardTravelTime = Math.max(0, anom.stewardTravelTime - dt);
                    if (anom.stewardTravelTime <= 0) {
                        this.triggerEvent('INFO', `Steward er ankommet til tog ${anom.trainId} og begynder nødreparation af ${anom.component}.`, 'INFO');
                    }
                } else if (anom.stewardRepairTime !== undefined && anom.stewardRepairTime > 0) {
                    anom.stewardRepairTime = Math.max(0, anom.stewardRepairTime - dt);
                    if (anom.stewardRepairTime <= 0) {
                        this.resolveAnomalyDirectly(anom.id);
                    }
                }
            }
        });

        // Anomaly Generation Chance (Sænket for Tycoon tempo)
        if (this.tutorialStep >= 2) {
            let chance = 0.001; // Sænket fra 0.005 (5x sjældnere)
            if (this.maintenanceStrategy === 'PREVENTIVE') chance = 0.0004; // 60% reduktion af fejlrate
            else if (this.maintenanceStrategy === 'CONDITIONAL') chance = 0.0008; // 20% reduktion af fejlrate

            if (Math.random() < chance * dt) {
                const train = trains[Math.floor(Math.random() * trains.length)];
                const components = ['Motor', 'Doors', 'Brakes', 'HVAC'];
                const component = components[Math.floor(Math.random() * components.length)];

                const existing = this.anomalies.find(a => a.trainId === train.id && a.component === component);
                if (!existing) {
                    this.anomalies.push({
                        id: `ANOM_${Date.now()}`,
                        trainId: train.id,
                        component,
                        severity: 0.1 + Math.random() * 0.4,
                        detected: false
                    });
                }
            }
        }

        // Anomaly Evolution (Sænket for Tycoon tempo)
        this.anomalies.forEach(anom => {
            if (!anom.failed) {
                anom.severity += 0.01 * dt; // Langsommere udvikling (4x langsommere end 0.04)
                if (anom.severity >= 1.0) {
                    anom.severity = 1.0;
                    anom.failed = true;
                    anom.detected = true;
                    anom.timeSinceFailure = 0;
                    this.triggerEvent('FAILURE', `Kritisk fejl: ${anom.component} på ${anom.trainId}. Send en Steward i DATA dashboardet under 'Gold Layer'!`, 'NØDSTOP');
                    
                    // Fine depending on strategy
                    let fine = 1000;
                    if (this.maintenanceStrategy === 'PREDICTIVE') fine = 0;
                    else if (this.maintenanceStrategy === 'CONDITIONAL') fine = 500;
                    
                    if (fine > 0) {
                        this.applyPenalty(fine);
                    }
                }
            } else {
                anom.timeSinceFailure = (anom.timeSinceFailure || 0) + (dt / 3600);
            }
        });

        // Win/Lose Conditions
        if (this.gameStatus === 'PLAYING') {
            if (this.budget <= -5000 || this.passengerSatisfaction <= 0) {
                this.gameStatus = 'GAME_OVER';
            } else if (this.activeUpgrades.has('ROUTE_EXTENSION_1') && this.totalPassengersTransported >= 5000 && this.passengerSatisfaction >= 80) {
                this.gameStatus = 'VICTORY';
            }
        }
    }

    public deploySteward(anomalyId: string): boolean {
        const anomaly = this.anomalies.find(a => a.id === anomalyId);
        if (anomaly && anomaly.failed && !anomaly.stewardDeployed) {
            const availableStewards = this.stewardsCount - this.stewardsBusy;
            if (availableStewards > 0) {
                this.stewardsBusy += 1;
                anomaly.stewardDeployed = true;

                // Travel and repair duration based on steward training level
                let travel = this.stewardTrainingLevel === 1 ? 10 : this.stewardTrainingLevel === 2 ? 7 : 4;
                let repair = this.stewardTrainingLevel === 1 ? 6 : this.stewardTrainingLevel === 2 ? 4 : 2;

                // Apply steward special training (25% faster)
                if (this.stewardSpecialTraining) {
                    travel = Math.max(1, Math.round(travel * 0.75));
                    repair = Math.max(1, Math.round(repair * 0.75));
                }

                anomaly.stewardTravelTime = travel;
                anomaly.stewardRepairTime = repair;

                this.budget -= 800; // Deduct reactive repair cost
                this.triggerEvent('INFO', `Steward afsendt til tog ${anomaly.trainId} for at udbedre ${anomaly.component}.`, 'INFO');
                return true;
            }
        }
        return false;
    }

    public resolveAnomaly(id: string) {
        const anomaly = this.anomalies.find(a => a.id === id);
        if (anomaly) {
            if (anomaly.failed) {
                // Reactive repair: must deploy steward
                this.deploySteward(id);
                return;
            }

            // Predictive early repair is instant
            this.anomalies = this.anomalies.filter(a => a.id !== id);
            let cost = 300;
            if (this.maintenanceStrategy === 'PREDICTIVE') {
                cost = 100;
            } else if (this.maintenanceStrategy === 'CONDITIONAL') {
                cost = 250;
            }
            this.budget -= cost;
            this.dataLakeSavings += (800 - cost) + 1000;

            if (id === 'ANOM_TUTORIAL' && this.tutorialStep === 1) {
                this.tutorialStep = 2;
            }
        }
    }

    private resolveAnomalyDirectly(id: string) {
        const anomaly = this.anomalies.find(a => a.id === id);
        if (anomaly) {
            this.anomalies = this.anomalies.filter(a => a.id !== id);
            this.stewardsBusy = Math.max(0, this.stewardsBusy - 1);
            this.resolvedTrainIds.push(anomaly.trainId);
            this.triggerEvent('INFO', `Reparation fuldført på tog ${anomaly.trainId}. Driften genoptages.`, 'INFO');

            if (id === 'ANOM_TUTORIAL' && this.tutorialStep === 1) {
                this.tutorialStep = 2;
            }
        }
    }
}

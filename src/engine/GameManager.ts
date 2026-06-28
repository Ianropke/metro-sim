export class GameManager {
    public passengerSatisfaction: number = 100.0; // 0-100%
    public energyEfficiency: number = 100.0; // 0-100%
    public totalPassengersTransported: number = 0;
    public timeScale: number = 2; // 0: pause, 1: 1x, 2: 2x, 3: 4x
    public tutorialStep: number = 0; // 0: Watch & earn, 1: Buy train, 2: Wear warning, 3: First failure, 4: Research, 5: Free play
    public dataLakeSavings: number = 0; // Cumulative savings from predictive maintenance

    // Milestone Progression System
    public milestones: { id: string; name: string; target: number; reward: number; description: string; unlocks?: string; reached: boolean }[] = [
        { id: 'MS1', name: 'Første Drift', target: 50, reward: 2000, description: 'Du har transporteret dine første 50 passagerer! Dit lille metrosystem begynder at tage form.', unlocks: 'Butik låses op', reached: false },
        { id: 'MS2', name: 'Voksende Netværk', target: 200, reward: 3000, description: '200 passagerer transporteret! Passagererne strømmer til, og kompleksiteten stiger.', unlocks: 'Forskningscenter', reached: false },
        { id: 'MS3', name: 'Professionel Drift', target: 500, reward: 5000, description: '500 passagerer transporteret! Du driver nu en professionel metrolinje.', unlocks: 'Gratis Auto Steward-kald', reached: false },
        { id: 'MS4', name: 'Metro-Baron', target: 1500, reward: 5000, description: '1.500 passagerer transporteret! Byen kræver mere metro.', unlocks: 'Ruteudvidelse tilgængelig i Butikken', reached: false },
        { id: 'MS5', name: 'Metropol-Mester', target: 3000, reward: 0, description: '3.000 passagerer transporteret! Du har skabt et verdensklasse metrosystem.', reached: false },
    ];
    public activeMilestonePopup: { id: string; name: string; reward: number; description: string } | null = null;

    // Economy
    public budget: number = 15000; // Starting budget (increased for strategic room)
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

    // Tycoon Personnel
    public inspectorsCount: number = 0; // Billetkontrollører
    public engineersCount: number = 0; // Baneingeniører

    // Tycoon Wear and Tear
    public trackWear: number = 0.0; // 0-100%
    public trainWear: { [trainId: string]: number } = {}; // trainId -> wear%

    // Active Operations Timers
    public ticketInspectionTimer: number = 0.0; // manual ticket check campaign
    public dataAuditTimer: number = 0.0; // active data audit countdown
    public isDataAuditActive: boolean = false;

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
    public timeOfDay: number = 7.5 * 3600; // Starts at 07:30 (morning rush) for immediate engagement
    public timeSpeedMultiplier: number = 60; // 1 real second = 60 game seconds (1 minute)

    // Config
    private readonly SATISFACTION_DECAY_PER_WAITING_PAX = 0.000075; // % per second per pax (reduced for tycoon pace)
    private readonly ENERGY_PENALTY_PER_KWH = 0.05; // % per kWh used

    // Active Upgrades Set
    public activeUpgrades: Set<string> = new Set();

    public purchaseUpgrade(id: string, cost: number): boolean {
        if (this.budget >= cost) {
            if (id === 'BUY_TRAIN') {
                this.budget -= cost;
                this.activeUpgrades.add(id);
                if (this.tutorialStep === 1) this.tutorialStep = 2;
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
            if (id === 'HIRE_INSPECTOR') {
                this.budget -= cost;
                this.inspectorsCount += 1;
                return true;
            }
            if (id === 'HIRE_ENGINEER') {
                this.budget -= cost;
                this.engineersCount += 1;
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

        // Ticket Inspector wages ($60 per game-hour = 1.00 per game-minute per inspector)
        const inspectorWages = this.inspectorsCount * 1.00 * gameMinutes;
        this.budget -= inspectorWages;

        // Track Engineer wages ($90 per game-hour = 1.50 per game-minute per engineer)
        const engineerWages = this.engineersCount * 1.50 * gameMinutes;
        this.budget -= engineerWages;

        // Active Strategy Cost (per game-hour)
        let strategyRate = 0;
        if (this.maintenanceStrategy === 'PREVENTIVE') strategyRate = 400;
        else if (this.maintenanceStrategy === 'CONDITIONAL') strategyRate = 600;
        else if (this.maintenanceStrategy === 'PREDICTIVE') strategyRate = 800;
        this.budget -= strategyRate * (gameMinutes / 60); // rate per hour, so divide gameMinutes by 60 to get hours

        // Ticket inspection campaign timer countdown
        if (this.ticketInspectionTimer > 0) {
            this.ticketInspectionTimer = Math.max(0, this.ticketInspectionTimer - dt);
            // 6% chance per game second of catching a fare evader during manual ticket check
            if (Math.random() < 0.06 * dt) {
                const fine = 150;
                this.budget += fine;
                this.triggerEvent('INFO', `Billetkontrol fangede passager uden billet: +$${fine}`, 'BILLETKONTROL');
                this.moneyPopups.push({
                    id: `POP_FINE_${Date.now()}_${Math.random()}`,
                    amount: fine,
                    x: 200 + Math.random() * 400,
                    timestamp: Date.now()
                });
            }
        }

        // Automatic ticket inspectors running in background
        if (this.inspectorsCount > 0) {
            // 1.5% chance per inspector per game second
            if (Math.random() < 0.015 * this.inspectorsCount * dt) {
                const fine = 120;
                this.budget += fine;
                this.triggerEvent('INFO', `Billetkontrollør fangede passager uden billet: +$${fine}`, 'BILLETKONTROL');
                this.moneyPopups.push({
                    id: `POP_FINE_${Date.now()}_${Math.random()}`,
                    amount: fine,
                    x: 200 + Math.random() * 400,
                    timestamp: Date.now()
                });
            }
        }

        // Data Audit progress (game seconds)
        if (this.isDataAuditActive) {
            // Speed factor: 1.0 baseline, +0.5 per data analyst
            const auditSpeed = 1.0 + this.dataAnalystsCount * 0.5;
            this.dataAuditTimer = Math.max(0, this.dataAuditTimer - dt * auditSpeed);
            if (this.dataAuditTimer <= 0) {
                this.isDataAuditActive = false;
                const grant = 500;
                this.budget += grant;
                this.triggerEvent('INFO', `Dataanalyse gennemført! Modtog forskningsbevilling: +$${grant}`, 'FORSKNING');
                this.moneyPopups.push({
                    id: `POP_AUDIT_${Date.now()}_${Math.random()}`,
                    amount: grant,
                    x: 400,
                    timestamp: Date.now()
                });
            }
        }

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
            decayFactor *= 0.40; // 60% reduction from automated PIDS (more impactful investment)
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
        if (this.budget >= 25) {
            this.budget -= 25;
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
        this.passengerSatisfaction = Math.min(100, this.passengerSatisfaction + (paxCount * 0.35));

        // Add Ticket Revenue
        const revenue = paxCount * this.ticketPrice;
        this.budget += revenue;

        // Check milestones
        this.checkMilestones();

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

    public totalFailuresCount: number = 0;

    private triggerEvent(type: 'DELAY' | 'FAILURE' | 'INFO', description: string, name?: string) {
        if (type === 'FAILURE') {
            this.totalFailuresCount = (this.totalFailuresCount || 0) + 1;
        }
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
        let actualCost = cost;
        let actualDuration = strategy === 'PREVENTIVE' ? 60.0 : strategy === 'CONDITIONAL' ? 120.0 : 180.0;
        
        if (this.tutorialStep === 4 && strategy === 'PREVENTIVE') {
            actualCost = 100;
            actualDuration = 15.0;
        }

        if (this.budget >= actualCost && !this.activeResearch && !this.unlockedStrategies.has(strategy)) {
            this.budget -= actualCost;
            this.activeResearch = strategy;
            this.researchProgress = 0.0;
            this.researchDuration = actualDuration;
            this.researchTimeRemaining = actualDuration;
            this.triggerEvent('INFO', `Forskning startet: Implementering af ${strategy} vedligeholdelse.`, 'FORSKNING');
            
            if (this.tutorialStep === 4 && strategy === 'PREVENTIVE') {
                this.tutorialStep = 5;
            }
            return true;
        }
        return false;
    }

    public checkForAnomalies(dt: number, trains: { id: string }[]) {
        // --- TUTORIAL LOGIC (REWORKED: Positive-first flow) ---
        // Step 0: Watch & earn — just wait for first passenger delivery
        if (this.tutorialStep === 0) {
            if (this.totalPassengersTransported > 0) {
                this.tutorialStep = 1;
            }
        }

        // Step 1: Buy second train (growth-focused, not failure-focused)
        // Triggered by milestone 1 (50 pax) which auto-advances to step 1
        // Player buys a train to advance to step 2

        // Step 2: Wear warning (gradual, not instant 80%)
        if (this.tutorialStep === 2) {
            const targetTrain = trains.find(t => t.id === 'TRN01');
            if (targetTrain) {
                const currentWear = this.trainWear['TRN01'] || 0;
                // Gradually ramp wear to 60% (not instant 80%) to teach maintenance
                if (currentWear < 60) {
                    this.trainWear['TRN01'] = Math.min(60, currentWear + 0.5 * dt);
                }
                if (currentWear >= 55 && currentWear < 61 && !this.activeEvents.some(e => e.name === 'TUTORIAL')) {
                    this.triggerEvent('INFO', `Advarsel: TRN01 er ved at blive slidt. Klik på toget (TRN01) og vælg 'Eftersyn' for at vedligeholde det.`, 'TUTORIAL');
                }
            }
        }

        // Step 3: First natural failure — force only after player has learned maintenance
        if (this.tutorialStep === 3) {
            if (this.anomalies.length === 0) {
                const trn01 = trains.find(t => t.id === 'TRN01');
                if (trn01) {
                    this.anomalies.push({
                        id: `ANOM_TUTORIAL`,
                        trainId: 'TRN01',
                        component: 'Doors',
                        severity: 1.0,
                        detected: true,
                        failed: true,
                        timeSinceFailure: 0
                    });
                    this.triggerEvent('FAILURE', `Din første fejl! Dørene på TRN01 sidder fast. Hold musen over TRN01 (blinker rødt) og klik 'SEND STEWARD'.`, 'TUTORIAL');
                }
            }
        }

        // Step 4: Research unlock — after fixing failure
        if (this.tutorialStep === 4) {
            // Just waiting for player to start research in the Research Center
        }

        // Step 5: Free play — everything unlocked
        // No forced events

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

        // --- TYCOON WEAR & TEAR LOGIC ---
        if (this.tutorialStep >= 5) {
            // Update Train Wear for active trains
            trains.forEach(t => {
                const stateStr = (t as any).state || (t as any).stateMachine?.currentState;
                if (stateStr !== 'DEPOT') {
                    const currentWear = this.trainWear[t.id] || 0;
                    // Reaches 100% in ~250000 game seconds (~70 game hours, or ~70 real minutes)
                    this.trainWear[t.id] = Math.min(100, currentWear + 0.0002 * dt);

                    // If a train's wear is 100%, trigger a breakdown!
                    if (this.trainWear[t.id] >= 100) {
                        const components = ['Motor', 'Doors', 'Brakes', 'HVAC'];
                        const component = components[Math.floor(Math.random() * components.length)];
                        const existing = this.anomalies.find(a => a.trainId === t.id && a.component === component);
                        if (!existing) {
                            this.anomalies.push({
                                id: `ANOM_${Date.now()}`,
                                trainId: t.id,
                                component,
                                severity: 1.0,
                                detected: true,
                                failed: true,
                                timeSinceFailure: 0
                            });
                            this.triggerEvent('FAILURE', `Nedbrud: ${component} på ${t.id} fejlet pga. slid!`, 'SLITAGE');
                            this.trainWear[t.id] = 85; // back down slightly
                        }
                    }
                }
            });

            // Update Track Wear
            const activeTrainsCount = trains.filter(t => {
                const stateStr = (t as any).state || (t as any).stateMachine?.currentState;
                return stateStr !== 'DEPOT';
            }).length;

            const trackWearInc = 0.003 * activeTrainsCount * dt;
            const trackWearDec = this.engineersCount * 0.04 * dt;
            this.trackWear = Math.min(100, Math.max(0, this.trackWear + trackWearInc - trackWearDec));

            // Track wear breakdown
            if (this.trackWear >= 100) {
                const existingTrackAnom = this.anomalies.find(a => a.trainId === 'TRACK');
                if (!existingTrackAnom) {
                    this.anomalies.push({
                        id: `ANOM_TRACK_${Date.now()}`,
                        trainId: 'TRACK',
                        component: 'Spor & Signaler',
                        severity: 1.0,
                        detected: true,
                        failed: true,
                        timeSinceFailure: 0
                    });
                    this.triggerEvent('FAILURE', `Baneinfrastruktur nedbrudt: Sporskifte- og signalfejl!`, 'BANEFEJL');
                    this.trackWear = 90;
                }
            }
        }

        // Anomaly Generation Chance (Sænket 10x for Tycoon tempo, da fejl primært drives af slitage)
        if (this.tutorialStep >= 5) {
            let chance = 0.000003; // Very low base chance — failures primarily driven by wear
            if (this.maintenanceStrategy === 'PREVENTIVE') chance = 0.000001;
            else if (this.maintenanceStrategy === 'CONDITIONAL') chance = 0.000002;

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
                anom.severity += 0.001 * dt; // Endnu langsommere udvikling for tycoon pace (tager ~100 real seconds to break down)
                if (anom.severity >= 1.0) {
                    anom.severity = 1.0;
                    anom.failed = true;
                    anom.detected = true;
                    anom.timeSinceFailure = 0;
                    this.triggerEvent('FAILURE', `Kritisk fejl: ${anom.component} på ${anom.trainId}. Send en Steward i DATA dashboardet under 'Gold Layer'!`, 'NØDSTOP');
                    
                    // Fine depending on strategy
                    let fine = 400; // Reduced from 1000 — failures are annoying, not catastrophic
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
            } else if (this.activeUpgrades.has('ROUTE_EXTENSION_1') && this.totalPassengersTransported >= 3000 && this.passengerSatisfaction >= 80) {
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
                let travel = this.stewardTrainingLevel === 1 ? 6 : this.stewardTrainingLevel === 2 ? 4 : 2;
                let repair = this.stewardTrainingLevel === 1 ? 4 : this.stewardTrainingLevel === 2 ? 3 : 1;

                // Apply steward special training (25% faster)
                if (this.stewardSpecialTraining) {
                    travel = Math.max(1, Math.round(travel * 0.75));
                    repair = Math.max(1, Math.round(repair * 0.75));
                }

                anomaly.stewardTravelTime = travel;
                anomaly.stewardRepairTime = repair;

                this.budget -= 200; // Deduct reactive repair cost
                this.triggerEvent('INFO', `Steward afsendt til tog ${anomaly.trainId} for at udbedre ${anomaly.component}.`, 'INFO');
                return true;
            }
        }
        return false;
    }

    private resetWearForAnomaly(trainId: string) {
        if (trainId === 'TRACK') {
            this.trackWear = 0;
        } else if (trainId && this.trainWear[trainId] !== undefined) {
            this.trainWear[trainId] = 0;
        }
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
            this.resetWearForAnomaly(anomaly.trainId);
            let cost = 200;
            if (this.maintenanceStrategy === 'PREDICTIVE') {
                cost = 100;
            } else if (this.maintenanceStrategy === 'CONDITIONAL') {
                cost = 150;
            }
            this.budget -= cost;
            this.dataLakeSavings += (800 - cost) + 1000;

            if (id === 'ANOM_TUTORIAL' && this.tutorialStep === 3) {
                this.tutorialStep = 4;
            }
        }
    }

    private resolveAnomalyDirectly(id: string) {
        const anomaly = this.anomalies.find(a => a.id === id);
        if (anomaly) {
            this.anomalies = this.anomalies.filter(a => a.id !== id);
            this.stewardsBusy = Math.max(0, this.stewardsBusy - 1);
            this.resolvedTrainIds.push(anomaly.trainId);
            this.resetWearForAnomaly(anomaly.trainId);
            this.triggerEvent('INFO', `Reparation fuldført på tog ${anomaly.trainId}. Driften genoptages.`, 'INFO');

            if (id === 'ANOM_TUTORIAL' && this.tutorialStep === 3) {
                this.tutorialStep = 4;
            }
        }
    }

    public performTrainMaintenance(trainId: string): boolean {
        if (this.budget >= 150) {
            this.budget -= 150;
            this.trainWear[trainId] = 0;
            this.triggerEvent('INFO', `Eftersyn gennemført på tog ${trainId}. Slitage nulstillet.`, 'VEDLIGEHOLDELSE');
            if (this.tutorialStep === 2 && trainId === 'TRN01') {
                this.tutorialStep = 3;
            }
            return true;
        }
        return false;
    }

    public performTrackMaintenance(): boolean {
        if (this.budget >= 400) {
            this.budget -= 400;
            this.trackWear = 0;
            
            // Also resolve track failure anomaly if it exists!
            const trackAnom = this.anomalies.find(a => a.trainId === 'TRACK');
            if (trackAnom) {
                this.anomalies = this.anomalies.filter(a => a.trainId !== 'TRACK');
                this.resolvedTrainIds.push('TRACK'); // in case simulation loop checks it
                this.triggerEvent('INFO', `Sporreparation fuldført. Driften genoptages.`, 'VEDLIGEHOLDELSE');
            } else {
                this.triggerEvent('INFO', `Sporvedligeholdelse gennemført. Skinnetilstand genoprettet.`, 'VEDLIGEHOLDELSE');
            }
            return true;
        }
        return false;
    }

    public startTicketInspection(): boolean {
        if (this.budget >= 100 && this.ticketInspectionTimer <= 0) {
            this.budget -= 100;
            this.ticketInspectionTimer = 1800; // 30 game minutes (30 real seconds at speedMultiplier=60)
            this.triggerEvent('INFO', `Manuel billetkontrol startet på hele linjen i 30 min.`, 'BILLETKONTROL');
            return true;
        }
        return false;
    }

    public startDataAudit(): boolean {
        if (!this.isDataAuditActive) {
            this.isDataAuditActive = true;
            this.dataAuditTimer = 900; // 15 game minutes (15 real seconds)
            this.triggerEvent('INFO', `Dataanalyse-audit startet. Overvåger linjedrift...`, 'FORSKNING');
            return true;
        }
        return false;
    }

    private checkMilestones() {
        this.milestones.forEach(ms => {
            if (!ms.reached && this.totalPassengersTransported >= ms.target) {
                ms.reached = true;
                // Cash bonus
                if (ms.reward > 0) {
                    this.budget += ms.reward;
                    this.moneyPopups.push({
                        id: `POP_MS_${Date.now()}_${Math.random()}`,
                        amount: ms.reward,
                        x: 400,
                        timestamp: Date.now()
                    });
                }
                // Unlock special rewards
                if (ms.id === 'MS3') {
                    this.autoStewardCall = true;
                    this.activeUpgrades.add('AUTO_STEWARD_CALL');
                }
                // Show celebration popup
                this.activeMilestonePopup = {
                    id: ms.id,
                    name: ms.name,
                    reward: ms.reward,
                    description: ms.description
                };
                this.triggerEvent('INFO', `🏆 Milepæl nået: ${ms.name}! ${ms.reward > 0 ? `+$${ms.reward.toLocaleString()} bonus!` : ''}`, 'MILEPÆL');
            }
        });
    }

    public dismissMilestonePopup() {
        this.activeMilestonePopup = null;
    }
}

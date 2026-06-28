import { Train } from './Train';
import { ZoneController } from './Signaling';
import { SCADA_Manager } from './SCADA';
import { Station } from './Station';
import { GameManager } from './GameManager';

export class SimulationLoop {
    public trains: Train[] = [];
    public zoneController: ZoneController;
    public scada: SCADA_Manager;
    public stations: Station[] = [];
    public gameManager: GameManager;

    private lastTime: number = 0;
    private accumulator: number = 0;
    private accumulatedEnergyKWh: number = 0;
    private readonly PHYSICS_DT = 0.02; // 20ms (50Hz)

    constructor() {
        this.zoneController = new ZoneController();
        this.scada = new SCADA_Manager();
        this.gameManager = new GameManager();

        // Initialize Mock Data
        this.initScenario();
    }

    private initScenario() {
        // Create Stations
        this.stations.push(new Station('STN01', 'Vanløse', 0));
        this.stations.push(new Station('STN02', 'Flintholm', 800));
        this.stations.push(new Station('STN03', 'Lindevang', 1600));
        this.stations.push(new Station('STN04', 'Fasanvej', 2400));
        this.stations.push(new Station('STN05', 'Frederiksberg', 3200));
        this.stations.push(new Station('STN06', 'Forum', 4100));
        this.stations.push(new Station('STN07', 'Nørreport', 5000));

        // Create Trains
        const t1 = new Train('TRN01', 100);
        t1.stateMachine.transitionTo('AUTO_DRIVE'); // Start in Auto
        this.trains.push(t1);
        this.zoneController.registerTrain(t1);

        // Run headway signaling immediately to establish initial LMAs before simulation ticks
        this.zoneController.updateHeadways();
    }


    public tick(realDt: number, speedMultiplier: number = 10) {
        const gameDt = realDt * speedMultiplier;
        this.accumulator += gameDt;

        // Physics Loop (Fixed Step)
        while (this.accumulator >= this.PHYSICS_DT) {
            const isExtended = this.gameManager.activeUpgrades.has('ROUTE_EXTENSION_1');
            const MAX_POS = isExtended ? 5000 : 2400; // 5000 is Nørreport, 2400 is Frederiksberg
            this.zoneController.updateHeadways(MAX_POS);
            this.updatePhysics(this.PHYSICS_DT);
            this.accumulator -= this.PHYSICS_DT;
        }

        // Logic Loop
        this.updateLogic(gameDt);
    }

    private updatePhysics(dt: number) {
        let totalPower = 0;

        const isExtended = this.gameManager.activeUpgrades.has('ROUTE_EXTENSION_1');
        const MAX_POS = isExtended ? 5000 : 2400; // 5000 is Nørreport, 2400 is Frederiksberg

        // Update all trains
        this.trains.forEach(train => {
            // Update physics, controller and doors
            train.update(dt, 0, this.stations, this.gameManager, MAX_POS);

            // Calculate actual power consumption (Motoring minus Regen)
            let tractiveForce = 0;
            if (train.brakeCommand === 0 && !train.isEmergencyBrake) {
                tractiveForce = train.traction.calculateTractiveEffort(train.physics.velocity, train.throttleCommand);
                if (this.gameManager.activeUpgrades.has('MOTOR_UPGRADE')) {
                    tractiveForce *= 1.25;
                }
            }

            // Power = F * v
            const motoringPower = train.traction.calculatePowerConsumption(tractiveForce, train.physics.velocity);

            // Regen Braking power recovery
            let regenPower = 0;
            if (train.brakeCommand > 0 && train.physics.velocity > 0) {
                const targetDecel = train.brakeCommand * 1.1;
                const brakingForce = train.braking.calculateBrakingForce(
                    targetDecel,
                    train.physics.velocity,
                    train.physics.mass_effective,
                    dt,
                    train.isEmergencyBrake
                );
                const p_regen_mech = brakingForce * train.physics.velocity;
                const regenRatio = train.braking.getRegenRatio(train.physics.velocity);
                const regenEfficiency = this.gameManager.activeUpgrades.has('REGEN_BRAKING') ? 0.85 : 0.50;
                regenPower = p_regen_mech * regenRatio * regenEfficiency;
            }

            const netPower = motoringPower - regenPower; // can be negative (recovering energy)
            totalPower += netPower;

            // Update SCADA Tags
            this.scada.updateTag(`${train.id}_VEL`, train.physics.velocity * 3.6); // km/h
            this.scada.updateTag(`${train.id}_POS`, train.physics.position);
            this.scada.updateTag(`${train.id}_PWR`, netPower);
            this.scada.updateTag(`${train.id}_PAX`, train.passengerCount);

            // Log to Data Lake (Sampled)
            if (Math.random() < 0.1) { // Log 10% of updates to avoid spamming
                this.scada.logTelemetry(`${train.id}_VEL`, (train.physics.velocity * 3.6).toFixed(1));
                this.scada.logTelemetry(`${train.id}_PWR`, netPower.toFixed(1));
            }
        });

        // Update Game Manager (Energy)
        // Power (kW) * dt (s) / 3600 = kWh
        this.accumulatedEnergyKWh += (totalPower * dt) / 3600;
    }

    private updateLogic(dt: number) {
        // Auto-reset emergency brakes on trains repaired by stewards
        if (this.gameManager.resolvedTrainIds && this.gameManager.resolvedTrainIds.length > 0) {
            this.gameManager.resolvedTrainIds.forEach(trainId => {
                const train = this.trains.find(t => t.id === trainId);
                if (train) {
                    train.isEmergencyBrake = false;
                    if (train.stateMachine.currentState === 'EMERGENCY') {
                        train.stateMachine.transitionTo('AUTO_DRIVE');
                    }
                }
            });
            this.gameManager.resolvedTrainIds = []; // clear queue
        }

        // Check if BUY_TRAIN upgrade is pending
        if (this.gameManager.activeUpgrades.has('BUY_TRAIN')) {
            this.gameManager.activeUpgrades.delete('BUY_TRAIN'); // clear it
            const newTrainId = `TRN0${this.trains.length + 1}`;
            // Spawn in the Depot
            const newTrain = new Train(newTrainId, 0);
            newTrain.direction = 1;
            newTrain.stateMachine.transitionTo('DEPOT');
            this.trains.push(newTrain);
            this.zoneController.registerTrain(newTrain);
            
            this.scada.logTelemetry('SYSTEM', `Dispatched new train: ${newTrainId}`);
            const eventId = `NEW_TRN_${Date.now()}`;
            this.gameManager.activeEvents.push({
                id: eventId,
                name: 'Train Dispatched',
                description: `New automated train ${newTrainId} is entering service!`,
                type: 'INFO',
                timestamp: Date.now()
            });
            setTimeout(() => {
                this.gameManager.activeEvents = this.gameManager.activeEvents.filter(e => e.id !== eventId);
            }, 5000);
        }

        // Update Stations/Pax
        let totalWaiting = 0;
        const isExtended = this.gameManager.activeUpgrades.has('ROUTE_EXTENSION_1');
        this.stations.forEach(st => {
            // Only generate passengers if station is unlocked or part of the base 4
            const isBaseStation = st.position <= 2400;
            
            if (isBaseStation || isExtended) {
                st.update(dt, this.gameManager.timeOfDay);
            }
            totalWaiting += st.passengerCount;
        });

        // Update Game Manager (Satisfaction & Energy)
        this.gameManager.update(dt, totalWaiting, this.accumulatedEnergyKWh);
        this.accumulatedEnergyKWh = 0; // reset
        this.gameManager.checkForEvents(dt);
        this.gameManager.checkForAnomalies(dt, this.trains);
    }

    public getState() {
        return {
            trains: this.trains.map(t => ({
                id: t.id,
                position: t.physics.position,
                velocity: t.physics.velocity,
                state: t.stateMachine.currentState,
                direction: t.direction,
                passengerCount: t.passengerCount,
                maxCapacity: t.maxCapacity,
                dwellTimer: t.dwellTimer,
                totalDwellTime: t.totalDwellTime,
                isManualOverride: t.isManualOverride
            })),
            stations: this.stations.map(s => ({
                name: s.name,
                position: s.position,
                pax: s.passengerCount
            })),
            alarms: this.scada.getActiveAlarms(),
            game: {
                timeOfDay: this.gameManager.timeOfDay,
                timeScale: this.gameManager.timeScale,
                satisfaction: this.gameManager.passengerSatisfaction,
                efficiency: this.gameManager.energyEfficiency,
                budget: this.gameManager.budget,
                events: this.gameManager.activeEvents,
                anomalies: this.gameManager.anomalies,
                maintenanceStrategy: this.gameManager.maintenanceStrategy,
                activeUpgrades: this.gameManager.activeUpgrades,
                gameStatus: this.gameManager.gameStatus,
                totalPassengersTransported: this.gameManager.totalPassengersTransported,
                moneyPopups: this.gameManager.moneyPopups,
                tutorialStep: this.gameManager.tutorialStep,
                dataLakeSavings: this.gameManager.dataLakeSavings,
                stewardsCount: this.gameManager.stewardsCount,
                stewardsBusy: this.gameManager.stewardsBusy,
                stewardTrainingLevel: this.gameManager.stewardTrainingLevel,
                automatedPIDS: this.gameManager.automatedPIDS,
                isAnnouncementActive: this.gameManager.isAnnouncementActive,
                announcementTimer: this.gameManager.announcementTimer,
                sensorLevel: this.gameManager.sensorLevel,
                dataAnalystsCount: this.gameManager.dataAnalystsCount,
                hasARIIS: this.gameManager.hasARIIS,
                hasTRES: this.gameManager.hasTRES,
                stewardSpecialTraining: this.gameManager.stewardSpecialTraining,
                autoStewardCall: this.gameManager.autoStewardCall,
                unlockedStrategies: this.gameManager.unlockedStrategies,
                activeResearch: this.gameManager.activeResearch,
                researchProgress: this.gameManager.researchProgress,
                researchDuration: this.gameManager.researchDuration,
                researchTimeRemaining: this.gameManager.researchTimeRemaining,
                trackWear: this.gameManager.trackWear,
                trainWear: this.gameManager.trainWear,
                inspectorsCount: this.gameManager.inspectorsCount,
                engineersCount: this.gameManager.engineersCount,
                ticketInspectionTimer: this.gameManager.ticketInspectionTimer,
                dataAuditTimer: this.gameManager.dataAuditTimer,
                isDataAuditActive: this.gameManager.isDataAuditActive,
                milestones: this.gameManager.milestones,
                activeMilestonePopup: this.gameManager.activeMilestonePopup
            },
            fleet: {
                total: this.trains.length,
                active: this.trains.filter(t => t.stateMachine.currentState !== 'DEPOT').length,
                depot: this.trains.filter(t => t.stateMachine.currentState === 'DEPOT').length,
                broken: this.gameManager.anomalies.filter(a => a.failed).length
            },
            logs: this.scada.telemetryLog
        };
    }

    public triggerEmergency() {
        this.trains.forEach(t => t.stateMachine.transitionTo('EMERGENCY'));
        this.scada.raiseAlarm('GLOBAL_EMERGENCY', 'Global Emergency Stop Triggered', 1);
    }

    public setScenario(scenario: 'DEFAULT' | 'MORNING_RUSH') {
        if (scenario === 'MORNING_RUSH') {
            // Increase passenger generation rate
            // This is a hack for now, ideally PassengerGenerator should be configurable
            this.stations.forEach(s => {
                // Mocking high load by manually adding pax
                s.passengerCount += 500;
            });
            this.scada.raiseAlarm('SCENARIO_START', 'Morning Rush Hour Started: High Passenger Load', 3);
            const scenId = `SCEN_${Date.now()}`;
            this.gameManager.activeEvents.push({
                id: scenId,
                name: 'Morning Rush',
                description: 'Passenger levels critical. Keep headways low!',
                type: 'INFO',
                timestamp: Date.now()
            });
            setTimeout(() => {
                this.gameManager.activeEvents = this.gameManager.activeEvents.filter(e => e.id !== scenId);
            }, 5000);
        }
    }
}

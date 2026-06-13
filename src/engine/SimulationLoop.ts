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
        this.stations.push(new Station('STN02', 'Flintholm', 1200));
        this.stations.push(new Station('STN03', 'Lindevang', 2400));
        this.stations.push(new Station('STN04', 'Nørreport', 5000));

        // Create Trains
        const t1 = new Train('TRN01', 100);
        t1.stateMachine.transitionTo('AUTO_DRIVE'); // Start in Auto
        this.trains.push(t1);
        this.zoneController.registerTrain(t1);

        const t2 = new Train('TRN02', 2000);
        t2.stateMachine.transitionTo('AUTO_DRIVE');
        this.trains.push(t2);
        this.zoneController.registerTrain(t2);
    }

    public start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    public update(dt: number) {
        this.updatePhysics(dt);
        this.updateLogic(dt);
    }

    private loop(timestamp: number) {
        const frameTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.accumulator += frameTime;

        // Physics Loop (Fixed Step)
        while (this.accumulator >= this.PHYSICS_DT) {
            this.updatePhysics(this.PHYSICS_DT);
            this.accumulator -= this.PHYSICS_DT;
        }

        // Logic Loop (could be throttled, but running every frame for now)
        this.updateLogic(frameTime);

        requestAnimationFrame(this.loop.bind(this));
    }

    private updatePhysics(dt: number) {
        let totalPower = 0;

        // Update all trains
        this.trains.forEach(train => {
            // Update physics, controller and doors
            train.update(dt, 0, this.stations, this.gameManager);

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
        this.gameManager.update(dt, 0, (totalPower * dt) / 3600);
    }

    private updateLogic(dt: number) {
        // Check if BUY_TRAIN upgrade is pending
        if (this.gameManager.activeUpgrades.has('BUY_TRAIN')) {
            this.gameManager.activeUpgrades.delete('BUY_TRAIN'); // clear it
            const newTrainId = `TRN0${this.trains.length + 1}`;
            
            // Spawn at Vanløse (0m) or halfway (2000m)
            const spawnPos = this.trains.length % 2 === 0 ? 0 : 2000;
            const newTrain = new Train(newTrainId, spawnPos);
            newTrain.direction = 1;
            newTrain.stateMachine.transitionTo('AUTO_DRIVE');
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

        // Update Signaling
        this.zoneController.updateHeadways();

        // Update Stations/Pax
        let totalWaiting = 0;
        this.stations.forEach(st => {
            st.update(dt);
            totalWaiting += st.passengerCount;
        });

        // Update Game Manager (Satisfaction)
        this.gameManager.update(dt, totalWaiting, 0);
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
                satisfaction: this.gameManager.passengerSatisfaction,
                efficiency: this.gameManager.energyEfficiency,
                budget: this.gameManager.budget,
                events: this.gameManager.activeEvents,
                anomalies: this.gameManager.anomalies,
                maintenanceStrategy: this.gameManager.maintenanceStrategy,
                activeUpgrades: this.gameManager.activeUpgrades
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

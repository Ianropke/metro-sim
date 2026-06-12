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
            train.update(dt, 0); // Flat track for now

            // Calculate Power (Mock for now, should come from TractionSystem)
            // P = F * v
            // We need to expose this from Train/Traction
            const power = train.traction.calculatePowerConsumption(0, train.physics.velocity); // Need actual force
            totalPower += power;

            // Update SCADA Tags
            this.scada.updateTag(`${train.id}_VEL`, train.physics.velocity * 3.6); // km/h
            this.scada.updateTag(`${train.id}_POS`, train.physics.position);

            // Log to Data Lake (Sampled)
            if (Math.random() < 0.1) { // Log 10% of updates to avoid spamming
                this.scada.logTelemetry(`${train.id}_VEL`, (train.physics.velocity * 3.6).toFixed(1));
                this.scada.logTelemetry(`${train.id}_PWR`, train.traction.calculatePowerConsumption(0, train.physics.velocity).toFixed(1));
            }
        });

        // Update Game Manager (Energy)
        // Power (kW) * dt (s) / 3600 = kWh
        this.gameManager.update(dt, 0, (totalPower * dt) / 3600);
    }

    private updateLogic(dt: number) {
        // Update Signaling
        this.zoneController.updateHeadways();

        // Update Stations/Pax
        let totalWaiting = 0;
        this.stations.forEach(st => {
            st.update(dt);
            totalWaiting += st.passengerCount;

            // SIMULATION: Assume some passengers board/alight every update if train is present
            // In a real implementation, this would be event-driven from the Train/Station interaction
            // For now, we'll simulate a trickle of revenue based on total waiting pax (as if they are buying tickets)
            if (st.passengerCount > 0 && Math.random() < 0.01) {
                this.gameManager.addScore(1); // 1 passenger bought a ticket
                st.passengerCount--; // They boarded
            }
        });

        // Update Game Manager (Satisfaction)
        this.gameManager.update(dt, totalWaiting, 0);
        this.gameManager.checkForEvents(dt);
        this.gameManager.checkForAnomalies(dt, this.trains);
    }

    // API for UI to get state
    public getState() {
        return {
            trains: this.trains.map(t => ({
                id: t.id,
                position: t.physics.position,
                velocity: t.physics.velocity,
                state: t.stateMachine.currentState
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
                maintenanceStrategy: this.gameManager.maintenanceStrategy
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
            this.gameManager.activeEvents.push({
                id: `SCEN_${Date.now()}`,
                name: 'Morning Rush',
                description: 'Passenger levels critical. Keep headways low!',
                type: 'INFO',
                timestamp: Date.now()
            });
        }
    }
}

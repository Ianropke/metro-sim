import { TrainPhysics } from './Physics';
import { TractionSystem } from './Traction';
import { BrakingSystem } from './Braking';
import { VOBC } from './Signaling';
import { ATO } from './ATO';
import { TrainStateMachine, TrainState } from './StateMachine';
import { DoorSystem, DoorState } from './DoorSystem';
import { Station } from './Station';

interface Anomaly {
    id: string;
    trainId: string;
    component: string;
    severity: number;
    detected: boolean;
    failed?: boolean;
    timeSinceFailure?: number;
}

interface GameManagerLite {
    activeUpgrades: Set<string>;
    anomalies: Anomaly[];
    addScore(paxCount: number, positionX?: number): void;
    passengerSatisfaction: number;
    totalPassengersTransported?: number;
}

export class Train {
    public id: string;
    public physics: TrainPhysics;
    public traction: TractionSystem;
    public braking: BrakingSystem;
    public vobc: VOBC;
    public ato: ATO;
    public stateMachine: TrainStateMachine;
    public doorSystem: DoorSystem;

    // Control Inputs
    public throttleCommand: number = 0.0; // 0.0 to 1.0
    public brakeCommand: number = 0.0;    // 0.0 to 1.0 (Service Brake)
    public isEmergencyBrake: boolean = false;

    // Game Mechanics
    public direction: 1 | -1 = 1;         // 1 = Forward, -1 = Backward
    public passengerCount: number = 0;
    public maxCapacity: number = 200;
    public targetStation: Station | null = null;
    
    // Dwell management
    public dwellTimer: number = 0.0;
    public totalDwellTime: number = 0.0;
    public passengerExchangeDone: boolean = false;
    public isReturningToDepot: boolean = false;

    // Manual Override
    public isManualOverride: boolean = false;
    public manualThrottle: number = 0.0;
    public manualBrake: number = 0.0;

    constructor(id: string, initialPosition: number = 0) {
        this.id = id;
        this.physics = new TrainPhysics(initialPosition);
        this.traction = new TractionSystem();
        this.braking = new BrakingSystem();
        this.vobc = new VOBC();
        this.ato = new ATO();
        this.stateMachine = new TrainStateMachine();
        this.doorSystem = new DoorSystem();
    }

    /**
     * Search for the next station ahead on the track based on current direction.
     */
    public getTargetStation(stations: Station[]): Station | null {
        const pos = this.physics.position;
        if (this.direction === 1) {
            // Forward: first station with position > current position + 0.05m buffer
            const ahead = stations.filter(s => s.position > pos + 0.05).sort((a, b) => a.position - b.position);
            return ahead[0] || null;
        } else {
            // Backward: first station with position < current position - 0.05m buffer
            const behind = stations.filter(s => s.position < pos - 0.05).sort((a, b) => b.position - a.position);
            return behind[0] || null;
        }
    }

    public update(dt: number, grade: number = 0, stations: Station[] = [], gameManager: GameManagerLite | null = null, maxPosition: number = 5000) {
        // Check for active failed components (severity >= 1.0)
        let hasMotorFailure = false;
        let hasBrakeFailure = false;
        let hasDoorFailure = false;
        let hasHvacFailure = false;
        let hasCriticalFailure = false;

        if (gameManager && gameManager.anomalies) {
            const trainAnoms = gameManager.anomalies.filter((a) => a.trainId === this.id && a.severity >= 1.0);
            trainAnoms.forEach((a) => {
                if (a.component === 'Motor') hasMotorFailure = true;
                if (a.component === 'Brakes') hasBrakeFailure = true;
                if (a.component === 'Doors') hasDoorFailure = true;
                if (a.component === 'HVAC') hasHvacFailure = true;

                // Critical failure if left unhandled for 3 in-game hours
                if (a.timeSinceFailure && a.timeSinceFailure > 3.0) {
                    hasCriticalFailure = true;
                }
            });
        }

        // 0. Update State Machine & Doors
        this.stateMachine.update(dt);
        this.doorSystem.update(dt);

        // Apply HVAC failure penalty
        if (hasHvacFailure && gameManager) {
            // Drain passenger satisfaction by 0.5% per second per failed train
            gameManager.passengerSatisfaction = Math.max(0, gameManager.passengerSatisfaction - 0.5 * dt);
        }

        // Apply capacity upgrade if active
        if (gameManager?.activeUpgrades?.has('CAPACITY_UPGRADE')) {
            this.maxCapacity = 350;
        } else {
            this.maxCapacity = 200;
        }

        // Keep passenger load in sync with physics
        this.physics.setPassengerLoad(this.passengerCount);

        // 1. Update VOBC (Odometry & Safety)
        let safetyTrip = false;
        if (this.stateMachine.currentState !== TrainState.DEPOT && this.stateMachine.currentState !== TrainState.SLEEP) {
            safetyTrip = this.vobc.update(this.physics.position, this.physics.velocity, dt, this.direction);
        }
        if (safetyTrip || hasBrakeFailure || hasCriticalFailure) {
            this.isEmergencyBrake = true;
            this.stateMachine.transitionTo(TrainState.EMERGENCY);
        }

        // Find next target station
        const activeStations = stations.filter(s => s.position <= maxPosition);
        this.targetStation = this.getTargetStation(activeStations);

        // 2. Drive Control (ATO / Manual / Dwell / Depot)
        const doorsSafe = this.doorSystem.state === DoorState.CLOSED || this.doorSystem.state === DoorState.LOCKED;

        if (this.stateMachine.currentState === TrainState.EMERGENCY) {
            this.throttleCommand = 0;
            this.brakeCommand = 1.0;
            this.isEmergencyBrake = true;
        } 
        else if (this.stateMachine.currentState === TrainState.DWELL) {
            this.throttleCommand = 0;
            this.brakeCommand = 1.0; // Holding brake
            
            // Dwell timer management
            if (this.dwellTimer > 0) {
                this.dwellTimer -= dt;

                // Handle door closing trigger near end of dwell (blocked if doors failed)
                const closeTriggerTime = gameManager?.activeUpgrades?.has('FAST_DOORS') ? 1.5 : 3.0;
                if (this.dwellTimer <= closeTriggerTime && this.doorSystem.state === DoorState.OPEN && !hasDoorFailure) {
                    this.doorSystem.close();
                }

                // If doors get obstructed, extend dwell time
                if (this.doorSystem.state === DoorState.OBSTRUCTED) {
                    this.dwellTimer = Math.max(this.dwellTimer, closeTriggerTime + 1.0);
                }
            } else {
                // Dwell finished, verify doors are closed
                if (doorsSafe) {
                    if (this.isReturningToDepot) {
                        this.stateMachine.transitionTo(TrainState.DEPOT);
                        this.isReturningToDepot = false;
                        this.passengerExchangeDone = false;
                        this.direction = 1; // reset direction for when it deploys again
                        this.physics.position = 0; // jump to start
                    } else {
                        // If at terminal station, reverse direction!
                        if (this.physics.position <= 50) {
                            this.direction = 1;
                        } else if (this.physics.position >= maxPosition - 50) {
                            this.direction = -1;
                        }
                        this.stateMachine.transitionTo(TrainState.AUTO_DRIVE);
                        this.passengerExchangeDone = false;
                    }
                } else {
                    // Dwell finished but doors are not closed yet (e.g. resolved failure). Close them!
                    if (this.doorSystem.state !== DoorState.CLOSED && this.doorSystem.state !== DoorState.LOCKED && !hasDoorFailure) {
                        this.doorSystem.close();
                    }
                }
            }
        } 
        else if (this.stateMachine.currentState === TrainState.DEPOT || this.stateMachine.currentState === TrainState.SLEEP) {
            this.throttleCommand = 0;
            this.brakeCommand = 1.0;
        }
        else {
            // Normal operations (AUTO_DRIVE or MANUAL or TO_DEPOT)
            if (this.isManualOverride) {
                // User drives the train
                this.throttleCommand = this.manualThrottle;
                this.brakeCommand = this.manualBrake;
            } 
            else if (doorsSafe) {
                // ATO Automatic Driving
                let speedLimit = 80.0 / 3.6; // 80 km/h in m/s
                if (gameManager?.activeUpgrades?.has('MOTOR_UPGRADE')) {
                    speedLimit = 100.0 / 3.6; // 100 km/h in m/s
                }

                // Station slowing profile
                if (this.targetStation) {
                    const d_to_station = Math.abs(this.targetStation.position - this.physics.position);
                    const comfortDecel = 0.4; // m/s^2 (lowered to ensure train can easily stay below limit)
                    // Parabolic speed limit curve: v = sqrt(2 * a * d)
                    const stationSpeedLimit = Math.sqrt(2 * comfortDecel * Math.max(0, d_to_station));
                    speedLimit = Math.min(speedLimit, stationSpeedLimit);

                    // Stop condition: very close and slow
                    if (d_to_station < 3.0 && this.physics.velocity < 8.0) {
                        this.triggerStationDwell(this.targetStation, gameManager, maxPosition);
                    }
                } else {
                    // No target station, we must be at the very end. Stop!
                    if (this.physics.velocity < 0.15) {
                        // Trigger a dwell at terminal
                        const termStation = stations.find(s => Math.abs(s.position - this.physics.position) < 50);
                        if (termStation) {
                            this.triggerStationDwell(termStation, gameManager, maxPosition);
                        } else {
                            // Backup: flip direction immediately
                            this.direction = this.direction === 1 ? -1 : 1;
                        }
                    } else {
                        // Slow down to stop at terminus
                        const d_to_end = this.direction === 1 ? (maxPosition - this.physics.position) : this.physics.position;
                        const comfortDecel = 0.8;
                        const endSpeedLimit = Math.sqrt(2 * comfortDecel * Math.max(0, d_to_end));
                        speedLimit = Math.min(speedLimit, endSpeedLimit);
                    }
                }

                // Headway / LMA slowing profile
                const d_to_lma = this.direction * (this.vobc.lma - this.physics.position);
                if (d_to_lma > 0 && d_to_lma < 400) {
                    const comfortDecel = 0.8;
                    const lmaSpeedLimit = Math.sqrt(2 * comfortDecel * Math.max(0, d_to_lma - 15)); // 15m buffer
                    speedLimit = Math.min(speedLimit, lmaSpeedLimit);
                }

                // Update PID controls
                const commands = this.ato.updateSpeedControl(speedLimit, this.physics.velocity, dt);
                this.throttleCommand = commands.throttle;
                this.brakeCommand = commands.brake;
            } else {
                // Brakes on if doors are not safe
                this.throttleCommand = 0;
                this.brakeCommand = 1.0;
                // If doors are open/closing/opening but we are in AUTO_DRIVE/TO_DEPOT, and no door failure, close them!
                if (this.doorSystem.state !== DoorState.CLOSED && this.doorSystem.state !== DoorState.LOCKED && !hasDoorFailure) {
                    this.doorSystem.close();
                }
            }
        }

        // 3. Calculate Traction Force (blocked if motor failed)
        let tractiveForce = 0;
        if (this.brakeCommand === 0 && !this.isEmergencyBrake && !hasMotorFailure) {
            tractiveForce = this.traction.calculateTractiveEffort(this.physics.velocity, this.throttleCommand);
            // Apply Motor Upgrade boost
            if (gameManager?.activeUpgrades?.has('MOTOR_UPGRADE')) {
                tractiveForce *= 1.25;
            }
        }

        // 4. Calculate Braking Force
        const targetDecel = this.brakeCommand * 1.1; // 1.1 m/s^2 max
        const brakingForce = this.braking.calculateBrakingForce(
            targetDecel,
            this.physics.velocity,
            this.physics.mass_effective,
            dt,
            this.isEmergencyBrake
        );

        // Net Force
        const netDriveForce = tractiveForce - brakingForce;

        // 5. Update Physics
        this.physics.update(netDriveForce, grade, dt, this.direction);
    }

    /**
     * Set up station dwell state and handle boarding/alighting immediately
     */
    private triggerStationDwell(station: Station, gameManager: GameManagerLite | null, maxPosition: number = 5000) {
        this.stateMachine.transitionTo(TrainState.DWELL);
        this.physics.velocity = 0;
        this.physics.acceleration = 0;
        this.physics.position = station.position; // Snap precisely to platform
        this.doorSystem.open();

        // 1. Alighting Passengers
        let alighting = 0;
        if (station.position <= 10 || station.position >= maxPosition - 10) {
            // Terminus: everyone gets off!
            alighting = this.passengerCount;
        } else {
            // Intermediate station: 20-40% get off
            alighting = Math.floor(this.passengerCount * (0.2 + Math.random() * 0.2));
        }
        this.passengerCount = Math.max(0, this.passengerCount - alighting);
        if (gameManager) {
            gameManager.totalPassengersTransported = (gameManager.totalPassengersTransported || 0) + alighting;
        }

        // 2. Boarding Passengers
        const remainingCapacity = this.maxCapacity - this.passengerCount;
        const boarding = Math.min(station.passengerCount, remainingCapacity);
        
        this.passengerCount += boarding;
        station.passengerCount -= boarding;

        // Add ticket score and budget
        if (gameManager && boarding > 0) {
            gameManager.addScore(boarding, station.position);
        }

        // 3. Calculate Dwell Duration
        const baseOverhead = gameManager?.activeUpgrades?.has('FAST_DOORS') ? 3.0 : 6.0;
        const timePerPax = gameManager?.activeUpgrades?.has('CROWD_CONTROL') ? 0.05 : 0.15;
        const exchangeTime = Math.max(alighting, boarding) * timePerPax;
        const dwellTime = baseOverhead + exchangeTime;

        this.totalDwellTime = dwellTime;
        this.dwellTimer = dwellTime;
        this.passengerExchangeDone = true;
    }
}

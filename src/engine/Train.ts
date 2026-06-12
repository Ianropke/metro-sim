import { TrainPhysics } from './Physics';
import { TractionSystem } from './Traction';
import { BrakingSystem } from './Braking';
import { VOBC } from './Signaling';
import { ATO } from './ATO';
import { TrainStateMachine, TrainState } from './StateMachine';
import { DoorSystem, DoorState } from './DoorSystem';

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

    public update(dt: number, grade: number = 0) {
        // 0. Update State Machine & Doors
        this.stateMachine.update(dt);
        this.doorSystem.update(dt);

        // 1. Update VOBC (Odometry & Safety)
        const safetyTrip = this.vobc.update(this.physics.position, this.physics.velocity, dt);
        if (safetyTrip) {
            this.isEmergencyBrake = true;
            this.stateMachine.transitionTo(TrainState.EMERGENCY);
        }

        // 2. ATO Logic (if in Auto mode and not emergency)
        // Only drive if doors are closed and locked
        const doorsSafe = this.doorSystem.state === DoorState.CLOSED || this.doorSystem.state === DoorState.LOCKED;

        if (!this.isEmergencyBrake && doorsSafe && this.stateMachine.currentState === TrainState.AUTO_DRIVE) {
            // Simple logic: Try to reach speed limit
            const targetSpeed = Math.min(this.vobc.currentSpeedLimit, 80.0 / 3.6);
            const commands = this.ato.updateSpeedControl(targetSpeed, this.physics.velocity, dt);

            this.throttleCommand = commands.throttle;
            this.brakeCommand = commands.brake;
        } else {
            this.throttleCommand = 0;
            // Apply brakes if not safe to move (unless we are just stopped in dwell)
            if (this.stateMachine.currentState === TrainState.DWELL) {
                this.brakeCommand = 1.0; // Holding brake
            } else if (this.isEmergencyBrake) {
                this.brakeCommand = 1.0;
            } else {
                // Coasting or manual?
                this.brakeCommand = 1.0; // Default to stop for safety if logic undefined
            }
        }

        // 3. Calculate Traction Force
        let tractiveForce = 0;
        if (this.brakeCommand === 0 && !this.isEmergencyBrake) {
            tractiveForce = this.traction.calculateTractiveEffort(this.physics.velocity, this.throttleCommand);
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
        this.physics.update(netDriveForce, grade, dt);
    }
}

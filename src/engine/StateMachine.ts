export const TrainState = {
    SLEEP: 'SLEEP',
    STANDBY: 'STANDBY',
    INITIALIZATION: 'INITIALIZATION',
    AUTO_DRIVE: 'AUTO_DRIVE',
    DWELL: 'DWELL',
    RESTRICTED_MANUAL: 'RESTRICTED_MANUAL',
    EMERGENCY: 'EMERGENCY',
    DEPOT: 'DEPOT',
    TO_DEPOT: 'TO_DEPOT'
} as const;

export type TrainState = typeof TrainState[keyof typeof TrainState];

export class TrainStateMachine {
    public currentState: TrainState = TrainState.SLEEP;
    private stateTimer: number = 0;

    public update(dt: number) {
        this.stateTimer += dt;

        switch (this.currentState) {
            case TrainState.SLEEP:
                // Waiting for wake up command
                break;
            case TrainState.STANDBY:
                // Waiting for mission
                break;
            case TrainState.AUTO_DRIVE:
                // Normal operation
                break;
            case TrainState.DWELL:
                // Door operations
                break;
            case TrainState.EMERGENCY:
                // Waiting for reset
                break;
            case TrainState.DEPOT:
                // Parked in the service track
                break;
            case TrainState.TO_DEPOT:
                // Driving to terminal to be sent to depot
                break;
        }
    }

    public transitionTo(newState: TrainState) {
        if (this.currentState !== newState) {
            console.log(`Transitioning from ${this.currentState} to ${newState}`);
            this.currentState = newState;
            this.stateTimer = 0;
        }
    }
}

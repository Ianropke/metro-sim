export const DoorState = {
    CLOSED: 'CLOSED',
    OPENING: 'OPENING',
    OPEN: 'OPEN',
    CLOSING: 'CLOSING',
    OBSTRUCTED: 'OBSTRUCTED',
    LOCKED: 'LOCKED'
} as const;

export type DoorState = typeof DoorState[keyof typeof DoorState];

export class DoorSystem {
    public state: DoorState = DoorState.CLOSED;
    public obstructionCount: number = 0;

    // Timers
    private timer: number = 0;
    private readonly OPEN_TIME = 2.0; // seconds
    private readonly CLOSE_TIME = 3.0; // seconds
    private readonly OBSTRUCTION_CLEAR_TIME = 2.0;

    public update(dt: number) {
        switch (this.state) {
            case DoorState.OPENING:
                this.timer += dt;
                if (this.timer >= this.OPEN_TIME) {
                    this.state = DoorState.OPEN;
                    this.timer = 0;
                }
                break;
            case DoorState.CLOSING:
                this.timer += dt;
                // Simulate obstruction check during closing
                if (this.checkObstruction()) {
                    this.state = DoorState.OBSTRUCTED;
                    this.obstructionCount++;
                    this.timer = 0;
                } else if (this.timer >= this.CLOSE_TIME) {
                    this.state = DoorState.CLOSED;
                    this.timer = 0;
                }
                break;
            case DoorState.OBSTRUCTED:
                this.timer += dt;
                if (this.timer >= this.OBSTRUCTION_CLEAR_TIME) {
                    // Try to close again (re-open first usually, but simplified here)
                    this.state = DoorState.OPEN;
                    this.timer = 0;
                }
                break;
        }
    }

    public open() {
        if (this.state === DoorState.CLOSED || this.state === DoorState.LOCKED) {
            this.state = DoorState.OPENING;
            this.timer = 0;
        }
    }

    public close() {
        if (this.state === DoorState.OPEN) {
            this.state = DoorState.CLOSING;
            this.timer = 0;
        }
    }

    private checkObstruction(): boolean {
        // 1% chance per tick during closing? Too high.
        // Should be event based.
        // For now, let's say 0.1% chance per update call if closing.
        return Math.random() < 0.001;
    }
}

import { Train } from './Train';

export class ZoneController {
    // Safety Parameters
    private readonly SAFETY_MARGIN = 50.0; // meters (fixed buffer)
    private readonly REACTION_TIME = 2.0; // seconds (latency + build up)
    private readonly GEBR = 1.0; // Guaranteed Emergency Brake Rate (m/s^2) - conservative

    private activeTrains: Map<string, Train> = new Map();

    public registerTrain(train: Train) {
        this.activeTrains.set(train.id, train);
    }

    /**
     * Calculates the Limit of Movement Authority (LMA) for all trains.
     * This runs at a fixed frequency (e.g. 5Hz).
     */
    public updateHeadways() {
        // Sort trains by position per direction
        const allTrains = Array.from(this.activeTrains.values());
        
        const forwardTrains = allTrains
            .filter(t => t.direction === 1)
            .sort((a, b) => a.physics.position - b.physics.position);
            
        const backwardTrains = allTrains
            .filter(t => t.direction === -1)
            .sort((a, b) => b.physics.position - a.physics.position); // Sorted descending for backward movement

        // Forward Track: followers must stay behind leaders (smaller position)
        for (let i = 0; i < forwardTrains.length; i++) {
            const train = forwardTrains[i];

            if (i < forwardTrains.length - 1) {
                const leader = forwardTrains[i + 1];

                const v = train.physics.velocity;
                const d_braking = (v * v) / (2 * this.GEBR);
                const d_reaction = v * this.REACTION_TIME;

                const safetyBuffer = d_braking + d_reaction + this.SAFETY_MARGIN;
                const lma = leader.physics.position - safetyBuffer;

                train.vobc.setLMA(lma);
            } else {
                // No leader ahead on forward track, authority is the terminus (Nørreport at 5000m)
                train.vobc.setLMA(5000);
            }
        }

        // Backward Track: followers must stay behind leaders (larger position)
        for (let i = 0; i < backwardTrains.length; i++) {
            const train = backwardTrains[i];

            if (i < backwardTrains.length - 1) {
                const leader = backwardTrains[i + 1];

                const v = train.physics.velocity;
                const d_braking = (v * v) / (2 * this.GEBR);
                const d_reaction = v * this.REACTION_TIME;

                const safetyBuffer = d_braking + d_reaction + this.SAFETY_MARGIN;
                // Leader position is smaller than follower's position, so LMA is leader.pos + buffer
                const lma = leader.physics.position + safetyBuffer;

                train.vobc.setLMA(lma);
            } else {
                // No leader ahead on backward track, authority is the terminus (Vanløse at 0m)
                train.vobc.setLMA(0);
            }
        }
    }
}

export class VOBC {
    public lma: number = 0;
    public currentSpeedLimit: number = 80.0 / 3.6; // m/s

    // Odometry State
    public estimatedPosition: number = 0;
    public uncertainty: number = 0;

    public update(truePosition: number, _trueVelocity: number, _dt: number, direction: 1 | -1 = 1) {
        // Simulate Odometry
        this.estimatedPosition = truePosition;

        // Check Safety: trip if we exceed the LMA limit
        if (direction === 1) {
            if (this.estimatedPosition > this.lma) {
                return true; // Emergency Trip (overshot forward authority)
            }
        } else {
            if (this.estimatedPosition < this.lma) {
                return true; // Emergency Trip (overshot backward authority)
            }
        }
        return false;
    }

    public setLMA(lma: number) {
        this.lma = lma;
    }
}

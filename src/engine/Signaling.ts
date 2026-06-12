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
        // Sort trains by position (assuming single track for now)
        const sortedTrains = Array.from(this.activeTrains.values()).sort((a, b) => a.physics.position - b.physics.position);

        for (let i = 0; i < sortedTrains.length; i++) {
            const train = sortedTrains[i];

            // If there is a train ahead
            if (i < sortedTrains.length - 1) {
                const leader = sortedTrains[i + 1];

                // Calculate Safe Braking Distance for the follower
                // d_brake = v^2 / (2 * a)
                const v = Math.abs(train.physics.velocity);
                const d_braking = (v * v) / (2 * this.GEBR);

                // Distance traveled during reaction time
                const d_reaction = v * this.REACTION_TIME;

                // LMA = LeaderPos - SafetyBuffer
                // SafetyBuffer = BrakingDist + ReactionDist + FixedMargin
                // Note: In real CBTC, we target the *rear* of the leader. 
                // We assume position is the *front*, so we subtract leader length if we had it.
                // For now, assume point mass or handle length elsewhere.

                const safetyBuffer = d_braking + d_reaction + this.SAFETY_MARGIN;
                const lma = leader.physics.position - safetyBuffer;

                // Send LMA to VOBC
                // In a real sim, this is a radio message.
                // Here we cheat and set it directly on the train's VOBC (which we need to add).
                train.vobc.setLMA(lma);

                // For now, let's just log or store it on the train if we add a property.
                // We need to extend the Train class to have a VOBC.
            } else {
                // No leader, infinite authority (or end of track)
                // train.vobc.setLMA(100000); 
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

    public update(truePosition: number, _trueVelocity: number, _dt: number) {
        // Simulate Odometry
        // In reality, we integrate wheel ticks.
        // Here we just take truth and add noise if we wanted.
        this.estimatedPosition = truePosition;

        // Check Safety
        if (this.estimatedPosition > this.lma) {
            // Trigger Emergency Brake
            return true; // Emergency Trip
        }
        return false;
    }

    public setLMA(lma: number) {
        this.lma = lma;
    }
}

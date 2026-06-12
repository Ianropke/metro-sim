export class BrakingSystem {
    // Braking Characteristics
    private readonly MAX_SERVICE_BRAKE = 1.1; // m/s^2
    private readonly EMERGENCY_BRAKE_RATE = 1.3; // m/s^2
    private readonly JERK_LIMIT = 0.7; // m/s^3
    private readonly REGEN_FADE_SPEED = 5.0 / 3.6; // m/s (5 km/h)

    // State
    private currentDecelRequest: number = 0.0;
    // private currentBrakeForce: number = 0.0; // kN

    /**
     * Calculates the braking force required to achieve a target deceleration.
     * Handles jerk limiting and blending.
     * @param targetDecel Desired deceleration (positive value, m/s^2)
     * @param _currentVelocity Current speed (m/s)
     * @param massEff Effective mass (kg)
     * @param dt Time delta (s)
     * @param isEmergency If true, bypasses jerk limits
     * @returns Braking Force (kN) - Positive value (opposing motion)
     */
    public calculateBrakingForce(
        targetDecel: number,
        _currentVelocity: number,
        massEff: number,
        dt: number,
        isEmergency: boolean
    ): number {
        // 1. Clamp target deceleration
        let desiredDecel = Math.min(targetDecel, this.MAX_SERVICE_BRAKE);
        if (isEmergency) {
            desiredDecel = this.EMERGENCY_BRAKE_RATE;
        }

        // 2. Apply Jerk Limit (Rate of change of acceleration)
        // If not emergency, we cannot change accel too fast.
        if (!isEmergency) {
            const maxChange = this.JERK_LIMIT * dt;
            const delta = desiredDecel - this.currentDecelRequest;

            if (Math.abs(delta) > maxChange) {
                this.currentDecelRequest += Math.sign(delta) * maxChange;
            } else {
                this.currentDecelRequest = desiredDecel;
            }
        } else {
            this.currentDecelRequest = desiredDecel;
        }

        // 3. Calculate Required Force (F = ma)
        // Force needed to achieve this deceleration
        const requiredForce = (massEff * this.currentDecelRequest) / 1000.0; // kN

        // 4. Blending Logic (Regen vs Pneumatic)
        // This doesn't change the total force output, but it matters for energy scoring.
        // We can return an object with split values if needed, but for physics we just need total force.

        // If speed is low, regen is inefficient/impossible.
        // This is handled conceptually here.

        return requiredForce;
    }

    public getRegenRatio(velocity: number): number {
        if (Math.abs(velocity) < this.REGEN_FADE_SPEED) {
            return 0.0; // All pneumatic
        }
        return 1.0; // All regen (ideal)
    }
}

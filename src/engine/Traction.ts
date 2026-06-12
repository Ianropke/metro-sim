export class TractionSystem {
    // Motor Characteristics (Hitachi/Ansaldo generic)
    private readonly MAX_TRACTIVE_EFFORT = 120.0; // kN (at start)
    private readonly BASE_SPEED = 30.0 / 3.6; // m/s (approx 30 km/h)
    private readonly MAX_POWER = 1000.0; // kW (approx 1MW total traction power)
    private readonly MAX_SPEED = 90.0 / 3.6; // m/s (approx 90 km/h)

    // Efficiency
    private readonly EFFICIENCY = 0.90; // 90% motor efficiency

    /**
     * Calculates the available tractive effort at a given speed and throttle.
     * @param velocity Current speed (m/s)
     * @param throttle Throttle command (0.0 to 1.0)
     * @returns Tractive Force (kN)
     */
    public calculateTractiveEffort(velocity: number, throttle: number): number {
        const v_abs = Math.abs(velocity);
        let maxForce = 0;

        // 1. Constant Torque Region (0 < v < v_base)
        if (v_abs < this.BASE_SPEED) {
            maxForce = this.MAX_TRACTIVE_EFFORT;
        }
        // 2. Constant Power Region (v_base < v < v_max)
        // P = F * v  =>  F = P / v
        else if (v_abs < this.MAX_SPEED) {
            // We clamp the force so it doesn't exceed max effort (continuity)
            // But theoretically it follows the hyperbola.
            maxForce = this.MAX_POWER / v_abs;
        }
        // 3. Characteristic Region (High speed fade out)
        // Often modeled as F proportional to 1/v^2 or just a sharper drop.
        // For simplicity, we'll stick to Constant Power up to max speed, 
        // but maybe apply a small penalty near max speed.
        else {
            maxForce = (this.MAX_POWER / v_abs) * 0.8; // Drop off
        }

        // Apply throttle scaling
        return maxForce * Math.max(0, Math.min(1, throttle));
    }

    /**
     * Calculates power consumption.
     * @param force Current tractive force being applied (kN)
     * @param velocity Current speed (m/s)
     * @returns Power (kW)
     */
    public calculatePowerConsumption(force: number, velocity: number): number {
        // P_mechanical = F * v
        // P_electrical = P_mechanical / Efficiency
        const p_mech = force * Math.abs(velocity);
        return p_mech / this.EFFICIENCY;
    }
}

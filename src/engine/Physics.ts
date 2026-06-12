export interface DragCoeffs {
    A: number;   // Rolling resistance (kN)
    B: number;   // Viscous drag (kN/(m/s))
    C: number;   // Aerodynamic drag (kN/(m/s)^2)
    C_tunnel: number; // Aerodynamic drag in tunnel
}

export interface PhysicsState {
    velocity: number;      // m/s
    position: number;      // meters from line start
    acceleration: number;  // m/s^2
    mass_effective: number; // kg
}

export class TrainPhysics {
    // Physical Constants
    private readonly MASS_TARE = 55000.0; // kg (3-car set)
    private readonly ROTARY_INERTIA_FACTOR = 0.10; // 10% added mass
    private readonly GRAVITY = 9.81; // m/s^2

    // Davis Equation Coefficients (Hitachi Rail / AnsaldoBreda generic)
    private readonly DRAG: DragCoeffs = {
        A: 1.5,   // Static friction
        B: 0.02,  // Mechanical resistance
        C: 0.005, // Air drag (Open)
        C_tunnel: 0.012 // Air drag (Tunnel)
    };

    // State
    public velocity: number = 0.0;
    public position: number = 0.0;
    public acceleration: number = 0.0;
    public mass_pax: number = 0.0;
    public inTunnel: boolean = false;

    constructor(initialPosition: number = 0) {
        this.position = initialPosition;
    }

    /**
     * Updates the physics state for one simulation tick.
     * @param tractiveForce Force applied by motors (kN) - Positive for motoring, Negative for braking
     * @param grade Slope of the track (radians) - Positive is uphill
     * @param dt Time delta (seconds)
     */
    public update(tractiveForce: number, grade: number, dt: number): void {
        // 1. Calculate Effective Mass
        const totalStaticMass = this.MASS_TARE + this.mass_pax;
        const massEff = totalStaticMass * (1 + this.ROTARY_INERTIA_FACTOR);

        // 2. Calculate Resistive Forces (Davis Equation)
        // R(v) = A + Bv + Cv^2
        // Note: Resistance always opposes motion.
        const v_abs = Math.abs(this.velocity);
        const C_coeff = this.inTunnel ? this.DRAG.C_tunnel : this.DRAG.C;

        const f_resist = this.DRAG.A + (this.DRAG.B * v_abs) + (C_coeff * v_abs * v_abs);

        // Direction of resistance is opposite to velocity. 
        // If velocity is 0, resistance opposes the net active force (traction - grade) to prevent drift, 
        // but we'll simplify for now as "opposing intended movement" or just 0 if static.
        const dir = this.velocity > 0 ? 1 : (this.velocity < 0 ? -1 : 0);

        // 3. Calculate Grade Force
        // F_grade = M * g * sin(theta)
        // Positive grade (uphill) opposes forward motion.
        const f_grade = (totalStaticMass * this.GRAVITY * Math.sin(grade)) / 1000.0; // Convert N to kN

        // 4. Net Force
        // F_net = F_traction - F_resist - F_grade
        // We need to be careful with signs. 
        // F_traction is signed input.
        // F_resist always opposes velocity.
        // F_grade is positive uphill (opposes forward).

        let f_net = tractiveForce - (f_resist * dir) - f_grade;

        // Static Friction Logic (Stiction)
        // If speed is near zero and force is not enough to overcome static friction, stay still.
        if (Math.abs(this.velocity) < 0.01 && Math.abs(tractiveForce - f_grade) < this.DRAG.A) {
            f_net = 0;
            this.velocity = 0;
        }

        // 5. Acceleration (Newton's Second Law)
        // a = F / M
        // F is in kN, M is in kg. So F*1000 / M = m/s^2
        this.acceleration = (f_net * 1000.0) / massEff;

        // 6. Integration (Euler)
        // v = v + at
        // s = s + vt
        this.velocity += this.acceleration * dt;
        this.position += this.velocity * dt;

        // Sanity check for negative velocity (if we don't support reversing yet, or just to keep it clean)
        // For now, we allow reversing (rollback on hill).
    }

    public get mass_effective(): number {
        const totalStaticMass = this.MASS_TARE + this.mass_pax;
        return totalStaticMass * (1 + this.ROTARY_INERTIA_FACTOR);
    }

    public setPassengerLoad(count: number) {
        const WEIGHT_PER_PAX = 75.0; // kg
        this.mass_pax = count * WEIGHT_PER_PAX;
    }
}

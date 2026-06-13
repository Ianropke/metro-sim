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
    public update(tractiveForce: number, grade: number, dt: number, direction: 1 | -1 = 1): void {
        // 1. Calculate Effective Mass
        const totalStaticMass = this.MASS_TARE + this.mass_pax;
        const massEff = totalStaticMass * (1 + this.ROTARY_INERTIA_FACTOR);

        // 2. Calculate Resistive Forces (Davis Equation)
        // R(v) = A + Bv + Cv^2
        // Since velocity is absolute speed (>=0), resistive force always opposes it.
        const v_abs = this.velocity;
        const C_coeff = this.inTunnel ? this.DRAG.C_tunnel : this.DRAG.C;
        const f_resist = this.DRAG.A + (this.DRAG.B * v_abs) + (C_coeff * v_abs * v_abs);

        // 3. Calculate Grade Force in direction of motion
        // Positive grade (uphill) opposes motion. In reverse direction, positive grade is downhill.
        const f_grade_base = (totalStaticMass * this.GRAVITY * Math.sin(grade)) / 1000.0; // Convert N to kN
        const f_grade = direction * f_grade_base;

        // 4. Net Force
        // F_net = F_traction - F_resist - F_grade
        let f_net = tractiveForce - f_resist - f_grade;

        // Static Friction Logic (Stiction)
        if (this.velocity < 0.01 && Math.abs(tractiveForce - f_grade) < this.DRAG.A) {
            f_net = 0;
            this.velocity = 0;
        }

        // 5. Acceleration
        this.acceleration = (f_net * 1000.0) / massEff;

        // 6. Integration (Euler)
        this.velocity += this.acceleration * dt;
        if (this.velocity < 0) {
            this.velocity = 0;
            this.acceleration = 0;
        }
        
        // Update position in direction of travel
        this.position += direction * this.velocity * dt;
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

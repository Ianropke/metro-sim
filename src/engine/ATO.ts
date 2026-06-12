export class ATO {
    // PID Controller Gains
    private readonly Kp = 0.5;
    private readonly Ki = 0.01;
    private readonly Kd = 0.1;

    // State
    private integralError: number = 0.0;
    private prevError: number = 0.0;

    // Coasting Logic
    private isCoasting: boolean = false;

    /**
     * Calculates the throttle and brake commands to maintain a target speed.
     * @param targetSpeed Desired speed (m/s)
     * @param currentSpeed Actual speed (m/s)
     * @param dt Time delta (s)
     * @returns { throttle: number, brake: number }
     */
    public updateSpeedControl(targetSpeed: number, currentSpeed: number, dt: number): { throttle: number, brake: number } {
        const error = targetSpeed - currentSpeed;

        // Integral Term
        this.integralError += error * dt;
        // Clamp integral to prevent windup
        this.integralError = Math.max(-10, Math.min(10, this.integralError));

        // Derivative Term
        const derivative = (error - this.prevError) / dt;
        this.prevError = error;

        // PID Output
        const output = (this.Kp * error) + (this.Ki * this.integralError) + (this.Kd * derivative);

        // Normalize Output (-1.0 to 1.0)
        // Positive = Throttle, Negative = Brake

        let throttle = 0.0;
        let brake = 0.0;

        if (output > 0) {
            throttle = Math.min(1.0, output);
            brake = 0.0;
        } else {
            throttle = 0.0;
            brake = Math.min(1.0, -output);
        }

        return { throttle, brake };
    }

    /**
     * Checks if coasting should be active to save energy.
     * @param distanceToStation Distance remaining (m)
     * @param currentSpeed Current speed (m/s)
     * @param scheduledArrivalTime Timestamp (ms)
     * @param currentTime Timestamp (ms)
     */
    public checkCoasting(distanceToStation: number, currentSpeed: number, scheduledArrivalTime: number, currentTime: number) {
        // Simple heuristic: If we are going fast enough to reach the station early, coast.
        // T_remaining = Dist / v_avg (approx currentSpeed * 0.9 for coasting decay)

        if (currentSpeed < 1.0) return; // Don't coast if stopped

        const predictedTime = (distanceToStation / (currentSpeed * 0.95)) * 1000; // ms
        const timeRemaining = scheduledArrivalTime - currentTime;

        if (predictedTime < timeRemaining) {
            this.isCoasting = true;
        } else {
            this.isCoasting = false;
        }
    }

    public getCommands(): { throttle: number, brake: number } {
        if (this.isCoasting) {
            return { throttle: 0, brake: 0 };
        }
        return { throttle: 0, brake: 0 }; // Default, should be driven by updateSpeedControl
    }
}

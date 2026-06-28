export class PassengerGenerator {
    // Poisson Process Parameters
    // Base arrival rate
    private baseRate: number = 0.05; // passengers per second

    /**
     * Calculates the arrival rate multiplier based on the time of day.
     * @param timeOfDay Seconds since midnight (0 to 86400)
     */
    private getMultiplier(timeOfDay: number): number {
        const hours = timeOfDay / 3600;

        // Morning Rush: 07:00 - 09:00 (peak at 08:00)
        if (hours >= 7 && hours <= 9) {
            return 1.0 + 3.0 * Math.max(0, 1 - Math.abs(8 - hours));
        }
        // Afternoon Rush: 15:00 - 17:00 (peak at 16:00)
        if (hours >= 15 && hours <= 17) {
            return 1.0 + 3.0 * Math.max(0, 1 - Math.abs(16 - hours));
        }
        // Night Time: 22:00 - 05:00
        if (hours >= 22 || hours <= 5) {
            return 0.1; // 10% of normal traffic
        }
        
        // Normal Day
        return 1.0;
    }

    /**
     * Generates a random number of passengers arriving in the given time interval.
     * @param dt Time interval (seconds)
     * @param timeOfDay Current game time (seconds since midnight)
     * @returns Number of new passengers
     */
    public generatePassengers(dt: number, timeOfDay: number): number {
        const currentRate = this.baseRate * this.getMultiplier(timeOfDay);
        const expected = currentRate * dt;

        let pax = 0;
        let p = expected;
        while (p > 1) {
            pax++;
            p--;
        }
        if (Math.random() < p) {
            pax++;
        }
        return pax;
    }
}

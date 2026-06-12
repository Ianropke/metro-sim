export class PassengerGenerator {
    // Poisson Process Parameters
    private arrivalRate: number = 0.5; // passengers per second (lambda)

    /**
     * Generates a random number of passengers arriving in the given time interval.
     * Uses Poisson distribution approximation for small intervals or just rate * dt.
     * @param dt Time interval (seconds)
     * @returns Number of new passengers
     */
    public generatePassengers(dt: number): number {
        // For small dt, P(1 arrival) ~ lambda * dt
        // We can just accumulate fractional passengers or use random check.

        const expected = this.arrivalRate * dt;

        // Simple randomized integer generation
        // If expected is 0.5, we have 50% chance of 1 pax.
        if (Math.random() < expected) {
            return 1;
        }
        return 0;
    }

    public setRate(rate: number) {
        this.arrivalRate = rate;
    }
}

import { PassengerGenerator } from './Passengers';

export class Station {
    public id: string;
    public name: string;
    public position: number; // meters from line start

    public passengerCount: number = 0;
    public generator: PassengerGenerator;

    constructor(id: string, name: string, position: number) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.generator = new PassengerGenerator();
    }

    public update(dt: number) {
        // Generate new passengers waiting on platform
        this.passengerCount += this.generator.generatePassengers(dt);
    }

    /**
     * Calculates dwell time based on passenger exchange.
     * @param alighting Number of passengers getting off
     * @param boarding Number of passengers getting on
     * @returns Required dwell time (seconds)
     */
    public calculateDwellTime(alighting: number, boarding: number): number {
        const FIXED_OPS_TIME = 6.0; // Door cycle overhead
        const TIME_PER_PAX = 1.0; // Seconds per passenger

        const exchangeTime = Math.max(alighting, boarding) * TIME_PER_PAX;
        return FIXED_OPS_TIME + exchangeTime;
    }
}

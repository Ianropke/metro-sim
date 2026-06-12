export class GameManager {
    public passengerSatisfaction: number = 100.0; // 0-100%
    public energyEfficiency: number = 100.0; // 0-100%
    public totalPassengersTransported: number = 0;

    // Economy
    public budget: number = 10000; // Starting budget
    public ticketPrice: number = 2.50; // $ per passenger
    public energyCostPerKWh: number = 0.15; // $ per kWh

    // Config
    private readonly SATISFACTION_DECAY_PER_WAITING_PAX = 0.001; // % per second per pax
    private readonly ENERGY_PENALTY_PER_KWH = 0.05; // % per kWh used

    public update(dt: number, waitingPax: number, energyUsedKWh: number) {
        // 1. Update Satisfaction
        // Decay based on people waiting
        const decay = waitingPax * this.SATISFACTION_DECAY_PER_WAITING_PAX * dt;
        this.passengerSatisfaction = Math.max(0, this.passengerSatisfaction - decay);

        // 2. Update Energy Efficiency & Cost
        // Simple linear penalty for now, could be relative to "ideal" usage
        this.energyEfficiency = Math.max(0, this.energyEfficiency - (energyUsedKWh * this.ENERGY_PENALTY_PER_KWH));

        // Deduct Energy Cost
        const energyCost = energyUsedKWh * this.energyCostPerKWh;
        this.budget -= energyCost;
    }

    public addScore(paxCount: number) {
        this.totalPassengersTransported += paxCount;
        // Boost satisfaction slightly for successful transport
        this.passengerSatisfaction = Math.min(100, this.passengerSatisfaction + (paxCount * 0.1));

        // Add Ticket Revenue
        this.budget += paxCount * this.ticketPrice;
    }

    public applyPenalty(amount: number) {
        this.budget -= amount;
    }

    // Event System
    public activeEvents: { id: string, name: string, description: string, type: 'DELAY' | 'FAILURE' | 'INFO', timestamp: number }[] = [];

    public checkForEvents(dt: number) {
        // Simple random event generator
        // 1% chance per second of an event
        if (Math.random() < 0.01 * dt) {
            this.triggerRandomEvent();
        }
    }

    private triggerRandomEvent() {
        const events = [
            { name: 'Passenger Holding Doors', description: 'Train delayed at station.', type: 'DELAY' },
            { name: 'Signal Glitch', description: 'Brief loss of communication.', type: 'FAILURE' },
            { name: 'VIP Transport', description: 'Bonus revenue for smooth ride.', type: 'INFO' }
        ] as const;

        const event = events[Math.floor(Math.random() * events.length)];
        const id = `EVT_${Date.now()}`;

        this.activeEvents.push({
            id,
            name: event.name,
            description: event.description,
            type: event.type,
            timestamp: Date.now()
        });

        // Auto-clear events after 5 seconds for now
        setTimeout(() => {
            this.activeEvents = this.activeEvents.filter(e => e.id !== id);
        }, 5000);
    }

    private triggerEvent(type: 'DELAY' | 'FAILURE' | 'INFO', description: string, name?: string) {
        const id = `EVT_${Date.now()}`;
        this.activeEvents.push({
            id,
            name: name || type, // Use type as name if not provided
            description,
            type,
            timestamp: Date.now()
        });

        // Auto-clear events after 5 seconds for now (similar to triggerRandomEvent)
        setTimeout(() => {
            this.activeEvents = this.activeEvents.filter(e => e.id !== id);
        }, 5000);
    }

    // Predictive Maintenance / Anomaly Detection
    public anomalies: { id: string, trainId: string, component: string, severity: number, detected: boolean }[] = [];
    public maintenanceStrategy: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE' = 'REACTIVE';

    public setMaintenanceStrategy(strategy: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE') {
        if (strategy === 'PREDICTIVE' && this.budget < 5000) return; // Can't afford setup
        if (strategy === 'PREDICTIVE' && this.maintenanceStrategy !== 'PREDICTIVE') {
            this.budget -= 5000; // Setup cost
        }
        this.maintenanceStrategy = strategy;
    }

    public checkForAnomalies(dt: number, trains: any[]) {
        // Strategy Costs
        if (this.maintenanceStrategy === 'PREVENTIVE') this.budget -= (500 / 60) * dt;
        if (this.maintenanceStrategy === 'PREDICTIVE') this.budget -= (100 / 60) * dt;

        // Anomaly Generation Chance
        let chance = 0.005; // Base chance 0.5% per sec
        if (this.maintenanceStrategy === 'PREVENTIVE') chance = 0.0025; // 50% reduction

        if (Math.random() < chance * dt) {
            const train = trains[Math.floor(Math.random() * trains.length)];
            const components = ['Motor', 'Doors', 'Brakes', 'HVAC'];
            const component = components[Math.floor(Math.random() * components.length)];

            this.anomalies.push({
                id: `ANOM_${Date.now()}`,
                trainId: train.id,
                component,
                severity: Math.random(), // 0.0 to 1.0
                detected: this.maintenanceStrategy === 'PREDICTIVE' // Only visible in Predictive mode
            });
        }

        // Anomaly Evolution (Hidden -> Failure)
        this.anomalies.forEach(anom => {
            anom.severity += 0.05 * dt; // Grows over time
            if (anom.severity >= 1.0) {
                // Evolve into Failure
                this.triggerEvent('FAILURE', `Failure: ${anom.component} on ${anom.trainId}`);
                this.applyPenalty(1000); // Expensive repair
                // Remove anomaly as it's now an active event
                this.anomalies = this.anomalies.filter(a => a.id !== anom.id);
            }
        });
    }

    public resolveAnomaly(id: string) {
        const anomaly = this.anomalies.find(a => a.id === id);
        if (anomaly) {
            this.anomalies = this.anomalies.filter(a => a.id !== id);
            // Cost depends on strategy
            if (this.maintenanceStrategy === 'PREDICTIVE') {
                this.budget -= 100; // Cheap fix
            } else {
                this.budget -= 500; // Standard fix (if somehow caught)
            }
        }
    }
}

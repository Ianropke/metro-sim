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

    // Active Upgrades Set
    public activeUpgrades: Set<string> = new Set();

    public purchaseUpgrade(id: string, cost: number): boolean {
        if (this.budget >= cost) {
            if (id === 'BUY_TRAIN') {
                this.budget -= cost;
                // We track buy train as a counter or simple trigger. In SimulationLoop, we check if
                // activeUpgrades has a flag or we can just trigger it.
                // We'll add it to set, and the SimulationLoop will read it and spawn the train, then clear or handle it.
                this.activeUpgrades.add(id);
                return true;
            }
            if (!this.activeUpgrades.has(id)) {
                this.budget -= cost;
                this.activeUpgrades.add(id);
                return true;
            }
        }
        return false;
    }

    public update(dt: number, waitingPax: number, energyUsedKWh: number) {
        // 1. Update Satisfaction
        // Decay based on people waiting
        const decay = waitingPax * this.SATISFACTION_DECAY_PER_WAITING_PAX * dt;
        this.passengerSatisfaction = Math.max(0, this.passengerSatisfaction - decay);

        // 2. Update Energy Efficiency & Cost
        // If energyUsedKWh is negative (regen braking), this will boost efficiency!
        this.energyEfficiency = Math.min(100, Math.max(0, this.energyEfficiency - (energyUsedKWh * this.ENERGY_PENALTY_PER_KWH)));

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
    public anomalies: { id: string, trainId: string, component: string, severity: number, detected: boolean, failed?: boolean }[] = [];
    public maintenanceStrategy: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE' = 'REACTIVE';

    public setMaintenanceStrategy(strategy: 'REACTIVE' | 'PREVENTIVE' | 'PREDICTIVE') {
        if (strategy === 'PREDICTIVE' && this.budget < 5000) return; // Can't afford setup
        if (strategy === 'PREDICTIVE' && this.maintenanceStrategy !== 'PREDICTIVE') {
            this.budget -= 5000; // Setup cost
        }
        this.maintenanceStrategy = strategy;
    }

    public checkForAnomalies(dt: number, trains: { id: string }[]) {
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

            // Check if there is already an anomaly for this train component to avoid duplicates
            const existing = this.anomalies.find(a => a.trainId === train.id && a.component === component);
            if (!existing) {
                this.anomalies.push({
                    id: `ANOM_${Date.now()}`,
                    trainId: train.id,
                    component,
                    severity: 0.1 + Math.random() * 0.4, // start with minor severity
                    detected: this.maintenanceStrategy === 'PREDICTIVE' // Only visible in Predictive mode
                });
            }
        }

        // Anomaly Evolution (Hidden -> Failure)
        this.anomalies.forEach(anom => {
            if (!anom.failed) {
                anom.severity += 0.04 * dt; // Grows over time
                if (anom.severity >= 1.0) {
                    anom.severity = 1.0;
                    anom.failed = true;
                    anom.detected = true; // Breakdown is immediately visible
                    this.triggerEvent('FAILURE', `Failure: ${anom.component} on ${anom.trainId}`);
                    this.applyPenalty(1000); // Expensive penalty for breakdown
                }
            }
        });
    }

    public resolveAnomaly(id: string) {
        const anomaly = this.anomalies.find(a => a.id === id);
        if (anomaly) {
            this.anomalies = this.anomalies.filter(a => a.id !== id);
            // Cost depends on strategy and severity
            if (anomaly.failed) {
                this.budget -= 800; // Repairing a fully failed component is expensive
            } else if (this.maintenanceStrategy === 'PREDICTIVE') {
                this.budget -= 100; // Cheap predictive fix
            } else {
                this.budget -= 400; // Standard fix
            }
        }
    }
}

export interface SCADA_Tag {
    id: string;
    value: number | boolean | string;
    timestamp: number;
    quality: boolean; // true = Good, false = Bad/Timeout
}

export const AlarmPriority = {
    CRITICAL: 1,
    URGENT: 2,
    MAINTENANCE: 3
} as const;

export type AlarmPriority = typeof AlarmPriority[keyof typeof AlarmPriority];

export interface Alarm {
    id: string;
    message: string;
    priority: AlarmPriority;
    active: boolean;
    timestamp: number;
}

export class SCADA_Manager {
    private tags: Map<string, SCADA_Tag> = new Map();
    private alarms: Map<string, Alarm> = new Map();

    public updateTag(id: string, value: number | boolean | string) {
        this.tags.set(id, {
            id,
            value,
            timestamp: Date.now(),
            quality: true
        });

        this.checkAlarms(id, value);
    }

    public getTag(id: string): SCADA_Tag | undefined {
        return this.tags.get(id);
    }

    private checkAlarms(id: string, value: number | boolean | string) {
        // Example Alarm Logic
        if (id.includes('VEL') && typeof value === 'number' && value > 90) {
            this.raiseAlarm(`OVERSPEED_${id}`, `Train Overspeed Detected: ${value} km/h`, AlarmPriority.CRITICAL);
        }
    }

    public raiseAlarm(id: string, message: string, priority: AlarmPriority) {
        if (!this.alarms.has(id)) {
            this.alarms.set(id, {
                id,
                message,
                priority,
                active: true,
                timestamp: Date.now()
            });
            console.warn(`[ALARM P${priority}] ${message}`);
        }
    }

    public clearAlarm(id: string) {
        if (this.alarms.has(id)) {
            this.alarms.delete(id);
        }
    }

    public getActiveAlarms(): Alarm[] {
        return Array.from(this.alarms.values()).filter(a => a.active);
    }

    // Data Intelligence / Telemetry Stream
    public telemetryLog: { id: string, tag: string, value: string | number | boolean, timestamp: number }[] = [];
    private readonly MAX_LOG_SIZE = 50;

    public logTelemetry(tag: string, value: string | number | boolean) {
        this.telemetryLog.unshift({
            id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tag,
            value,
            timestamp: Date.now()
        });
        if (this.telemetryLog.length > this.MAX_LOG_SIZE) {
            this.telemetryLog.pop();
        }
    }
}

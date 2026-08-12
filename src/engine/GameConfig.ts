export const UPGRADE_COSTS = {
    ROUTE_EXTENSION_1: 15000,
    REGEN_BRAKING: 5000,
    FAST_DOORS: 3000,
    CROWD_CONTROL: 2000,
    MOTOR_UPGRADE: 4000,
    CAPACITY_UPGRADE: 6000,
    BUY_TRAIN: 8000,
    HIRE_STEWARD: 1000,
    TRAIN_STEWARDS: 2500,
    HIRE_INSPECTOR: 800,
    HIRE_ENGINEER: 1200,
    AUTOMATED_PIDS: 2000,
    SENSOR_UPGRADE: 2000,
    HIRE_ANALYST: 1500,
    BUY_ARIIS: 3500,
    BUY_TRES: 4000,
    AUTO_STEWARD_CALL: 500,
    STEWARD_SPECIAL_TRAINING: 3000,
} as const;

export type UpgradeId = keyof typeof UPGRADE_COSTS;

export const OPERATING_COSTS = {
    announcement: 25,
    trainDeployment: 500,
    stewardRepair: 200,
    trainMaintenance: 150,
    trackMaintenance: 400,
    ticketInspection: 100,
} as const;

export const RESEARCH_CONFIG = {
    PREVENTIVE: { cost: 1000, duration: 60 },
    CONDITIONAL: { cost: 2500, duration: 120 },
    PREDICTIVE: { cost: 5000, duration: 180 },
} as const;

export const REPAIR_COSTS = {
    PREVENTIVE: 200,
    CONDITIONAL: 150,
    PREDICTIVE: 100,
} as const;

export const STRATEGY_HOURLY_COSTS = {
    REACTIVE: 0,
    PREVENTIVE: 400,
    CONDITIONAL: 600,
    PREDICTIVE: 800,
} as const;

export const STRATEGY_FAILURE_FINES = {
    REACTIVE: 400,
    PREVENTIVE: 400,
    CONDITIONAL: 500,
    PREDICTIVE: 0,
} as const;

export function getUpgradeCost(id: string): number | undefined {
    if (Object.prototype.hasOwnProperty.call(UPGRADE_COSTS, id)) {
        return UPGRADE_COSTS[id as UpgradeId];
    }
    return undefined;
}

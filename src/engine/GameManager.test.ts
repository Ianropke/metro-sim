import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from './GameManager';
import {
    OPERATING_COSTS,
    REPAIR_COSTS,
    RESEARCH_CONFIG,
    STRATEGY_HOURLY_COSTS,
    UPGRADE_COSTS,
} from './GameConfig';

describe('GameManager economy contracts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses the engine upgrade catalog instead of a UI-provided price', () => {
        const game = new GameManager();
        game.budget = UPGRADE_COSTS.BUY_TRAIN;

        expect(game.purchaseUpgrade('BUY_TRAIN', 1)).toBe(true);
        expect(game.budget).toBe(0);
        expect(game.activeUpgrades.has('BUY_TRAIN')).toBe(true);
    });

    it('rejects unknown upgrades without charging the budget', () => {
        const game = new GameManager();
        game.budget = 5000;

        expect(game.purchaseUpgrade('UNKNOWN_UPGRADE', 1)).toBe(false);
        expect(game.budget).toBe(5000);
    });

    it('uses catalog research costs and durations', () => {
        const game = new GameManager();
        game.budget = RESEARCH_CONFIG.CONDITIONAL.cost;
        game.tutorialStep = 5;

        expect(game.startResearch('CONDITIONAL', 1)).toBe(true);
        expect(game.budget).toBe(0);
        expect(game.researchDuration).toBe(RESEARCH_CONFIG.CONDITIONAL.duration);
        expect(game.researchTimeRemaining).toBe(RESEARCH_CONFIG.CONDITIONAL.duration);
    });

    it('keeps the tutorial research discount explicit', () => {
        const game = new GameManager();
        game.budget = 100;
        game.tutorialStep = 4;

        expect(game.startResearch('PREVENTIVE', 9999)).toBe(true);
        expect(game.budget).toBe(0);
        expect(game.researchDuration).toBe(15);
    });

    it('charges operating actions from the shared cost catalog', () => {
        const game = new GameManager();
        game.budget = OPERATING_COSTS.announcement;
        expect(game.broadcastAnnouncement()).toBe(true);
        expect(game.budget).toBe(0);

        game.budget = OPERATING_COSTS.trainMaintenance;
        expect(game.performTrainMaintenance('TRN01')).toBe(true);
        expect(game.budget).toBe(0);

        game.budget = OPERATING_COSTS.trackMaintenance;
        expect(game.performTrackMaintenance()).toBe(true);
        expect(game.budget).toBe(0);
    });

    it('charges early anomaly repair according to the active strategy', () => {
        const game = new GameManager();
        game.maintenanceStrategy = 'PREDICTIVE';
        game.budget = REPAIR_COSTS.PREDICTIVE;
        game.anomalies = [{
            id: 'ANOM_TEST',
            trainId: 'TRN01',
            component: 'Doors',
            severity: 0.7,
            detected: true,
        }];

        game.resolveAnomaly('ANOM_TEST');

        expect(game.budget).toBe(0);
        expect(game.anomalies).toHaveLength(0);
    });

    it('charges steward deployment from the shared operating costs', () => {
        const game = new GameManager();
        game.budget = OPERATING_COSTS.stewardRepair;
        game.anomalies = [{
            id: 'ANOM_FAILED',
            trainId: 'TRN01',
            component: 'Brakes',
            severity: 1,
            detected: true,
            failed: true,
        }];

        expect(game.deploySteward('ANOM_FAILED')).toBe(true);
        expect(game.budget).toBe(0);
        expect(game.stewardsBusy).toBe(1);
    });

    it('applies the shared hourly strategy rate', () => {
        const game = new GameManager();
        game.maintenanceStrategy = 'PREVENTIVE';
        game.stewardsCount = 0;
        game.budget = 1000;

        game.update(3600, 0, 0);

        expect(game.budget).toBeCloseTo(1000 - STRATEGY_HOURLY_COSTS.PREVENTIVE);
    });
});

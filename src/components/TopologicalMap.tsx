import React, { useState, useEffect } from 'react';
import { Stage, Container, Graphics, Text } from '@pixi/react';
import { TextStyle } from 'pixi.js';

interface TopologicalMapProps {
    trains: { 
        id: string; 
        position: number; 
        velocity: number; 
        state: string;
        direction: number;
        passengerCount: number;
        maxCapacity: number;
        dwellTimer: number;
        totalDwellTime: number;
        isManualOverride: boolean;
    }[];
    stations: { 
        name: string; 
        position: number; 
        pax: number;
    }[];
    moneyPopups: {
        id: string;
        amount: number;
        x: number;
        timestamp: number;
    }[];
    onTrainClick: (id: string) => void;
    isRouteExtended: boolean;
    anomalies: {
        id: string;
        trainId: string;
        component: string;
        severity: number;
        detected: boolean;
        failed?: boolean;
    }[];
}

export const TopologicalMap: React.FC<TopologicalMapProps> = ({ trains, stations, moneyPopups, onTrainClick, isRouteExtended, anomalies }) => {
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Label TextStyle
    const stationLabelStyle = {
        fontFamily: 'monospace',
        fontSize: 11,
        fill: '#94a3b8',
        fontWeight: 'bold' as const,
        letterSpacing: 1
    };

    const stationPaxStyle = (pax: number) => ({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: pax > 150 ? '#f43f5e' : pax > 60 ? '#f59e0b' : '#10b981',
        fontWeight: '900' as const
    });

    const trainLabelStyle = (isManual: boolean) => ({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: isManual ? '#c084fc' : '#ffffff',
        fontWeight: 'bold' as const,
        stroke: '#0f172a',
        strokeThickness: 3
    });

    const trainStateStyle = (state: string) => ({
        fontFamily: 'monospace',
        fontSize: 8,
        fill: state === 'EMERGENCY' ? '#f43f5e' : state === 'DWELL' ? '#f59e0b' : state === 'RESTRICTED_MANUAL' ? '#c084fc' : '#3b82f6',
        fontWeight: '900' as const,
        stroke: '#0f172a',
        strokeThickness: 2
    });

    return (
        <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundAlpha: 1, backgroundColor: 0x090d16 }}>

            <Container x={0} y={0}>
                {/* 1. Double Tracks Drawing */}
                <Graphics draw={(g) => {
                    g.clear();
                    
                    // Subtle background HUD grid
                    g.lineStyle(1, 0x1e293b, 0.15);
                    const gridSpacing = 40;
                    for (let gridX = 0; gridX < dimensions.width; gridX += gridSpacing) {
                        g.moveTo(gridX, 0);
                        g.lineTo(gridX, dimensions.height);
                    }
                    for (let gridY = 0; gridY < dimensions.height; gridY += gridSpacing) {
                        g.moveTo(0, gridY);
                        g.lineTo(dimensions.width, gridY);
                    }
                    
                    // Eastbound Track (Direction = 1) at y = 240
                    // Outer glow
                    g.lineStyle(6, 0x1e3a8a, 0.3);
                    g.moveTo(50, 240);
                    g.lineTo(dimensions.width - 50, 240);
                    // Inner wire
                    g.lineStyle(2, 0x3b82f6, 0.8);
                    g.moveTo(50, 240);
                    g.lineTo(dimensions.width - 50, 240);

                    // Westbound Track (Direction = -1) at y = 360
                    // Outer glow
                    g.lineStyle(6, 0x065f46, 0.3);
                    g.moveTo(50, 360);
                    g.lineTo(dimensions.width - 50, 360);
                    // Inner wire
                    g.lineStyle(2, 0x10b981, 0.8);
                    g.moveTo(50, 360);
                    g.lineTo(dimensions.width - 50, 360);

                    // Depot Track at y = 420
                    g.lineStyle(6, 0x475569, 0.3); // slate-600
                    g.moveTo(50, 420);
                    g.lineTo(dimensions.width - 50, 420);
                    g.lineStyle(2, 0x64748b, 0.8); // slate-500
                    g.moveTo(50, 420);
                    g.lineTo(dimensions.width - 50, 420);
                    
                    // Connectors/catenary poles at stations
                    stations.forEach(st => {
                        const isLocked = !isRouteExtended && st.position > 2400;
                        const color = isLocked ? 0x1e293b : 0x334155;
                        const alpha = isLocked ? 0.2 : 0.5;
                        const x = 50 + (st.position / 5000) * (dimensions.width - 100);
                        g.lineStyle(1, color, alpha);
                        g.moveTo(x, 240);
                        g.lineTo(x, 360);
                    });
                }} />

                {/* 2. Stations Drawing */}
                {stations.map(st => {
                    const isLocked = !isRouteExtended && st.position > 2400;
                    const x = 50 + (st.position / 5000) * (dimensions.width - 100);
                    return (
                        <Container key={st.name} x={x} y={300}>
                            {/* Clean schematic station dot and passenger dots */}
                            <Graphics draw={(g) => {
                                g.clear();
                                // Outer glow/halo for station area
                                g.lineStyle(1.5, isLocked ? 0x1e293b : 0x475569, isLocked ? 0.3 : 0.8);
                                g.beginFill(0x0f172a, isLocked ? 0.5 : 0.95);
                                g.drawCircle(0, 0, 14);
                                g.endFill();
                                
                                // Inner dot
                                g.beginFill(isLocked ? 0x475569 : 0xffffff, isLocked ? 0.5 : 1);
                                g.drawCircle(0, 0, 5);
                                g.endFill();

                                // Draw passengers as dots on the platform (bottleneck visual)
                                const numDots = Math.min(st.pax, 200);
                                g.beginFill(0x94a3b8, 0.8);
                                g.lineStyle(0);
                                for (let i = 0; i < numDots; i++) {
                                    // Golden angle spiral for organic distribution
                                    const angle = (i * 137.508) * (Math.PI / 180);
                                    const radius = 18 + Math.sqrt(i) * 2.5;
                                    const px = Math.cos(angle) * radius;
                                    const py = Math.sin(angle) * radius;
                                    // Compress y to make it look like a platform along the track
                                    g.drawCircle(px, py * 0.5, 1.5);
                                }
                                g.endFill();
                            }} />

                            {/* Station Name Label */}
                            <Text
                                text={st.name.toUpperCase()}
                                anchor={{ x: 0.5, y: 0 }}
                                y={20}
                                style={new TextStyle({
                                    ...stationLabelStyle,
                                    fill: isLocked ? '#475569' : '#94a3b8'
                                })}
                            />

                            {/* Passenger Queue counter */}
                            {!isLocked && (
                                <Text
                                    text={`${Math.floor(st.pax)} PAX`}
                                    anchor={{ x: 0.5, y: 1 }}
                                    y={-20}
                                    style={new TextStyle(stationPaxStyle(st.pax))}
                                />
                            )}
                        </Container>
                    );
                })}

                {/* 3. Trains Drawing */}
                {trains.map(train => {
                    let x = 50 + (train.position / 5000) * (dimensions.width - 100);
                    let y = train.direction === 1 ? 240 : 360;
                    
                    if (train.state === 'DEPOT') {
                        y = 420;
                        const depotIndex = trains.filter(t => t.state === 'DEPOT').findIndex(t => t.id === train.id);
                        x = 50 + (depotIndex * 90); // Space them out in the depot
                    }

                    // Check for anomalies on this train
                    const trainAnoms = anomalies ? anomalies.filter(a => a.trainId === train.id) : [];
                    const hasFailure = trainAnoms.some(a => a.failed);
                    const hasWarning = trainAnoms.some(a => !a.failed && a.detected);
                    const blink = Math.sin(Date.now() / 150) > 0;
                    
                    return (
                        <Container
                            key={train.id}
                            x={x}
                            y={y}
                            interactive={true as any}
                            pointerdown={() => onTrainClick(train.id)}
                            cursor={"pointer" as any}
                        >
                            {/* Open doors glow indicator */}
                            {train.state === 'DWELL' && (
                                <Graphics draw={(g) => {
                                    g.clear();
                                    g.lineStyle(1, 0xf59e0b, 0.4);
                                    g.beginFill(0xf59e0b, 0.15);
                                    g.drawCircle(0, 0, 32);
                                    g.endFill();
                                }} />
                            )}

                            {/* Animated boarding passenger particles */}
                            {train.state === 'DWELL' && (
                                <Container>
                                    {[...Array(3)].map((_, idx) => {
                                        const phase = ((Date.now() / 1000) + idx * 0.33) % 1.0;
                                        const startY = 300 - y; // distance relative to train height (eastbound = 25, westbound = -25)
                                        const particleY = startY + (0 - startY) * phase;
                                        
                                        return (
                                            <Graphics
                                                key={idx}
                                                draw={(g) => {
                                                    g.clear();
                                                    g.beginFill(0x10b981, 0.8 - phase * 0.5); // fades as it moves to train
                                                    g.drawCircle(0, particleY, 2.5);
                                                    g.endFill();
                                                }}
                                            />
                                        );
                                    })}
                                </Container>
                            )}

                            {/* Emergency trip warning glow */}
                            {(train.state === 'EMERGENCY' || hasFailure) && (
                                <Graphics draw={(g) => {
                                    g.clear();
                                    g.lineStyle(2, 0xef4444, 0.8);
                                    g.beginFill(0xef4444, 0.25);
                                    g.drawCircle(0, 0, 35);
                                    g.endFill();
                                }} />
                            )}

                            {/* Sleek vector train shape */}
                            <Graphics draw={(g) => {
                                g.clear();
                                
                                // Determine state color
                                let color = 0x3b82f6; // Auto running (blue)
                                if (hasFailure) {
                                    color = 0xef4444; // Failure (red)
                                } else if (train.state === 'EMERGENCY') {
                                    color = 0xef4444; // Emergency (red)
                                } else if (train.state === 'DWELL') {
                                    color = 0xf59e0b; // Dwell (orange)
                                } else if (train.isManualOverride) {
                                    color = 0xa855f7; // Manual override (purple)
                                }

                                // Train body (rounded rectangle)
                                g.beginFill(color, 1);
                                if (hasFailure && blink) {
                                    g.lineStyle(2.5, 0xef4444, 1.0); // Blinking red border
                                } else if (hasWarning && blink) {
                                    g.lineStyle(2.5, 0xf59e0b, 1.0); // Blinking yellow border
                                } else {
                                    g.lineStyle(1.5, 0xffffff, 0.9);
                                }
                                g.drawRoundedRect(-24, -8, 48, 16, 4);
                                g.endFill();

                                // Front window (pointing direction)
                                g.beginFill(0x0f172a, 1);
                                if (train.direction === 1) {
                                    // Pointing right
                                    g.drawRect(14, -6, 6, 12);
                                } else {
                                    // Pointing left
                                    g.drawRect(-20, -6, 6, 12);
                                }
                                g.endFill();
                                
                                // Passenger load bar inside train body
                                const fillRatio = Math.min(1.0, train.passengerCount / train.maxCapacity);
                                if (fillRatio > 0) {
                                    g.lineStyle(0);
                                    g.beginFill(0xffffff, 0.4);
                                    g.drawRect(-18, 3, 36 * fillRatio, 3);
                                    g.endFill();
                                }
                            }} />

                            {/* Blinking Warning Text Badge */}
                            {hasFailure && (
                                <Text
                                    text="⚠️ REPARATION NØDVENDIG"
                                    anchor={{ x: 0.5, y: 1 }}
                                    y={-32}
                                    style={new TextStyle({
                                        fontFamily: 'monospace',
                                        fontSize: 9,
                                        fill: '#f43f5e',
                                        fontWeight: '900',
                                        stroke: '#0f172a',
                                        strokeThickness: 3
                                    })}
                                    alpha={blink ? 1.0 : 0.4}
                                />
                            )}
                            {!hasFailure && hasWarning && (
                                <Text
                                    text="⚠️ SENSOR ADVARSEL"
                                    anchor={{ x: 0.5, y: 1 }}
                                    y={-32}
                                    style={new TextStyle({
                                        fontFamily: 'monospace',
                                        fontSize: 9,
                                        fill: '#f59e0b',
                                        fontWeight: '900',
                                        stroke: '#0f172a',
                                        strokeThickness: 3
                                    })}
                                    alpha={blink ? 1.0 : 0.4}
                                />
                            )}

                            {/* Train ID & Load Label */}
                            <Text
                                text={`${train.id} [${train.passengerCount}/${train.maxCapacity}]`}
                                anchor={{ x: 0.5, y: 1 }}
                                y={-18}
                                style={new TextStyle(trainLabelStyle(train.isManualOverride))}
                            />

                            {/* Train State Label */}
                            <Text
                                text={train.isManualOverride ? 'MANUAL' : train.state.replace('_', ' ')}
                                anchor={{ x: 0.5, y: 0 }}
                                y={18}
                                style={new TextStyle(trainStateStyle(train.state))}
                            />
                        </Container>
                    );
                })}

                {/* 4. Floating Money Popups */}
                {moneyPopups.map(popup => {
                    // eslint-disable-next-line
                    const now = Date.now();
                    const elapsed = now - popup.timestamp;
                    const progress = Math.min(1.0, elapsed / 2000);
                    const x = 50 + (popup.x / 5000) * (dimensions.width - 100);
                    const y = 280 - (progress * 50); // Float up 50 pixels
                    
                    const popupStyle = {
                        fontFamily: 'monospace',
                        fontSize: 16,
                        fill: '#10b981', // Emerald green
                        fontWeight: '900' as const,
                        stroke: '#064e3b',
                        strokeThickness: 3,
                        dropShadow: true,
                        dropShadowAlpha: 0.5 - (progress * 0.5),
                        dropShadowDistance: 2
                    };

                    // Add a tiny random offset so overlapping popups don't perfectly cover each other
                    const hashOffset = (popup.x % 17) - 8;

                    return (
                        <Text
                            key={popup.id}
                            text={`+$${Math.round(popup.amount)}`}
                            x={x + hashOffset}
                            y={y}
                            anchor={{ x: 0.5, y: 0.5 }}
                            style={new TextStyle(popupStyle)}
                            alpha={1.0 - Math.pow(progress, 3)} // Fade out slowly, then fast at the end
                        />
                    );
                })}
            </Container>
        </Stage>
    );
};

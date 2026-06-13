import React from 'react';
import { Stage, Container, Graphics, Sprite, TilingSprite, Text } from '@pixi/react';
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
    onTrainClick: (id: string) => void;
}

export const TopologicalMap: React.FC<TopologicalMapProps> = ({ trains, stations, onTrainClick }) => {
    
    // Label TextStyle
    const stationLabelStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fill: '#94a3b8',
        fontWeight: 'bold',
        letterSpacing: 1
    });

    const stationPaxStyle = (pax: number) => new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: pax > 150 ? '#f43f5e' : pax > 60 ? '#f59e0b' : '#10b981',
        fontWeight: '900'
    });

    const trainLabelStyle = (isManual: boolean) => new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: isManual ? '#c084fc' : '#ffffff',
        fontWeight: 'bold',
        stroke: '#0f172a',
        strokeThickness: 3
    });

    const trainStateStyle = (state: string) => new TextStyle({
        fontFamily: 'monospace',
        fontSize: 8,
        fill: state === 'EMERGENCY' ? '#f43f5e' : state === 'DWELL' ? '#f59e0b' : state === 'RESTRICTED_MANUAL' ? '#c084fc' : '#3b82f6',
        fontWeight: '900',
        stroke: '#0f172a',
        strokeThickness: 2
    });

    return (
        <Stage width={window.innerWidth} height={window.innerHeight} options={{ backgroundAlpha: 1, backgroundColor: 0x070b13 }}>

            {/* Background Texture */}
            <TilingSprite
                image="/assets/background.png"
                width={window.innerWidth}
                height={window.innerHeight}
                tileScale={{ x: 0.5, y: 0.5 }}
                tilePosition={{ x: 0, y: 0 }}
                alpha={0.15}
            />

            <Container x={0} y={0}>
                {/* 1. Double Tracks Drawing */}
                <Graphics draw={(g) => {
                    g.clear();
                    
                    // Subtle background HUD grid
                    g.lineStyle(1, 0x1e293b, 0.15);
                    const gridSpacing = 40;
                    for (let gridX = 0; gridX < window.innerWidth; gridX += gridSpacing) {
                        g.moveTo(gridX, 0);
                        g.lineTo(gridX, window.innerHeight);
                    }
                    for (let gridY = 0; gridY < window.innerHeight; gridY += gridSpacing) {
                        g.moveTo(0, gridY);
                        g.lineTo(window.innerWidth, gridY);
                    }
                    
                    // Eastbound Track (Direction = 1) at y = 275
                    // Outer glow
                    g.lineStyle(6, 0x1e3a8a, 0.3);
                    g.moveTo(50, 275);
                    g.lineTo(window.innerWidth - 50, 275);
                    // Inner wire
                    g.lineStyle(2, 0x3b82f6, 0.8);
                    g.moveTo(50, 275);
                    g.lineTo(window.innerWidth - 50, 275);

                    // Westbound Track (Direction = -1) at y = 325
                    // Outer glow
                    g.lineStyle(6, 0x065f46, 0.3);
                    g.moveTo(50, 325);
                    g.lineTo(window.innerWidth - 50, 325);
                    // Inner wire
                    g.lineStyle(2, 0x10b981, 0.8);
                    g.moveTo(50, 325);
                    g.lineTo(window.innerWidth - 50, 325);
                    
                    // Connectors/catenary poles at stations
                    stations.forEach(st => {
                        const x = 50 + (st.position / 5000) * (window.innerWidth - 100);
                        g.lineStyle(1, 0x334155, 0.5);
                        g.moveTo(x, 260);
                        g.lineTo(x, 340);
                    });
                }} />

                {/* 2. Stations Drawing */}
                {stations.map(st => {
                    const x = 50 + (st.position / 5000) * (window.innerWidth - 100);
                    return (
                        <Container key={st.name} x={x} y={300}>
                            {/* Station platform outline */}
                            <Graphics draw={(g) => {
                                g.clear();
                                g.beginFill(0x1e293b, 0.8);
                                g.lineStyle(1.5, 0x475569, 1);
                                g.drawRoundedRect(-24, -40, 48, 80, 6);
                                g.endFill();
                            }} />

                            <Sprite
                                image="/assets/station.png"
                                anchor={0.5}
                                scale={0.12}
                                y={0}
                            />

                            {/* Station Name Label */}
                            <Text
                                text={st.name.toUpperCase()}
                                anchor={{ x: 0.5, y: 0 }}
                                y={45}
                                style={stationLabelStyle}
                            />

                            {/* Passenger Queue counter */}
                            <Text
                                text={`${st.pax} PAX`}
                                anchor={{ x: 0.5, y: 1 }}
                                y={-45}
                                style={stationPaxStyle(st.pax)}
                            />
                        </Container>
                    );
                })}

                {/* 3. Trains Drawing */}
                {trains.map(train => {
                    const x = 50 + (train.position / 5000) * (window.innerWidth - 100);
                    const y = train.direction === 1 ? 275 : 325;
                    
                    return (
                        <Container
                            key={train.id}
                            x={x}
                            y={y}
                            interactive={true}
                            pointerdown={() => onTrainClick(train.id)}
                            cursor="pointer"
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
                            {train.state === 'EMERGENCY' && (
                                <Graphics draw={(g) => {
                                    g.clear();
                                    g.lineStyle(2, 0xef4444, 0.8);
                                    g.beginFill(0xef4444, 0.25);
                                    g.drawCircle(0, 0, 35);
                                    g.endFill();
                                }} />
                            )}

                            {/* Train Sprite (Flipped depending on direction) */}
                            <Sprite
                                image="/assets/train.png"
                                anchor={0.5}
                                scale={{ x: train.direction === 1 ? 0.22 : -0.22, y: 0.22 }}
                            />

                            {/* Train ID & Load Label */}
                            <Text
                                text={`${train.id} [${train.passengerCount}/${train.maxCapacity}]`}
                                anchor={{ x: 0.5, y: 1 }}
                                y={-18}
                                style={trainLabelStyle(train.isManualOverride)}
                            />

                            {/* Train State Label */}
                            <Text
                                text={train.isManualOverride ? 'MANUAL' : train.state.replace('_', ' ')}
                                anchor={{ x: 0.5, y: 0 }}
                                y={18}
                                style={trainStateStyle(train.state)}
                            />
                        </Container>
                    );
                })}
            </Container>
        </Stage>
    );
};

import React from 'react';
import { Stage, Container, Graphics, Sprite, TilingSprite } from '@pixi/react';

interface TopologicalMapProps {
    trains: { id: string, position: number, passengerCount?: number }[];
    stations: { name: string, position: number, passengerCount?: number }[];
    onTrainClick: (id: string) => void;
}

export const TopologicalMap: React.FC<TopologicalMapProps> = ({ trains, stations, onTrainClick }) => {
    return (
        <Stage width={window.innerWidth} height={window.innerHeight} options={{ backgroundAlpha: 1, backgroundColor: 0x0f172a }}>

            {/* Background Texture */}
            <TilingSprite
                image="/assets/background.png"
                width={window.innerWidth}
                height={window.innerHeight}
                tileScale={{ x: 0.5, y: 0.5 }}
                tilePosition={{ x: 0, y: 0 }}
                alpha={0.3}
            />

            <Container x={0} y={0}>
                <Graphics draw={(g) => {
                    // Outer Glow
                    g.clear();
                    g.lineStyle(6, 0x3b82f6, 0.2);
                    g.moveTo(50, 300);
                    g.lineTo(window.innerWidth - 50, 300);

                    // Inner Track
                    g.lineStyle(2, 0x94a3b8, 1); // Slate-400 track
                    g.moveTo(50, 300);
                    g.lineTo(window.innerWidth - 50, 300);
                }} />

                {/* Stations */}
                {stations.map(st => (
                    <Container key={st.name} x={50 + (st.position / 5000) * (window.innerWidth - 100)} y={300}>
                        <Sprite
                            image="/assets/station.png"
                            anchor={0.5}
                            scale={0.15}
                        />
                        {/* Passengers waiting */}
                        {st.passengerCount && st.passengerCount > 0 && (
                            <Container y={-40}>
                                {Array.from({ length: Math.min(st.passengerCount, 5) }).map((_, i) => (
                                    <Sprite
                                        key={i}
                                        image="/assets/passenger.png"
                                        x={(i - 2) * 10}
                                        y={0}
                                        anchor={0.5}
                                        scale={0.05}
                                    />
                                ))}
                            </Container>
                        )}
                    </Container>
                ))}

                {/* Trains */}
                {trains.map(train => (
                    <Container
                        key={train.id}
                        x={50 + (train.position / 5000) * (window.innerWidth - 100)}
                        y={300}
                        {...({
                            interactive: true,
                            pointerdown: () => onTrainClick(train.id),
                            cursor: 'pointer'
                        } as any)}
                    >
                        {/* Train Sprite */}
                        <Sprite
                            image="/assets/train.png"
                            anchor={0.5}
                            scale={0.2}
                        />
                    </Container>
                ))}
            </Container>
        </Stage>
    );
};

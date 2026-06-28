import React, { useState, useEffect, useRef } from 'react';
import { Stage, Container, Graphics, Text } from '@pixi/react';
import { TextStyle } from 'pixi.js';
import { AlertTriangle, Shield, User, Hammer, Users } from 'lucide-react';

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
        stewardDeployed?: boolean;
        stewardTravelTime?: number;
        stewardRepairTime?: number;
    }[];
    onResolveAnomaly?: (anomalyId: string) => void;
    stewardsCount?: number;
    stewardsBusy?: number;
    maintenanceStrategy?: 'REACTIVE' | 'PREVENTIVE' | 'CONDITIONAL' | 'PREDICTIVE';
}

export const TopologicalMap: React.FC<TopologicalMapProps> = ({ 
    trains, 
    stations, 
    moneyPopups, 
    onTrainClick, 
    isRouteExtended, 
    anomalies,
    onResolveAnomaly,
    stewardsCount = 1,
    stewardsBusy = 0,
    maintenanceStrategy = 'REACTIVE'
}) => {
    const [dimensions, setDimensions] = useState({
        width: Math.max(window.innerWidth - 600, 100),
        height: Math.max(window.innerHeight - 180, 100)
    });

    const [hoveredTrainId, setHoveredTrainId] = useState<string | null>(null);
    const [isHoveringCard, setIsHoveringCard] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTrainPointerOver = (id: string) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setHoveredTrainId(id);
    };

    const handleTrainPointerOut = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            setHoveredTrainId(null);
        }, 150);
    };

    const handleCardMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsHoveringCard(true);
    };

    const handleCardMouseLeave = () => {
        setIsHoveringCard(false);
        setHoveredTrainId(null);
    };


    // Zoom & Pan states
    const [zoom, setZoom] = useState(1.0);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: Math.max(window.innerWidth - 600, 100),
                height: Math.max(window.innerHeight - 180, 100)
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drag-to-pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left-click
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPanX(e.clientX - dragStart.x);
        setPanY(e.clientY - dragStart.y);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Scroll-to-zoom handler centered on mouse cursor
    const handleWheel = (e: React.WheelEvent) => {
        const zoomFactor = 1.1;
        let newZoom = zoom;
        if (e.deltaY < 0) {
            // Zoom In
            newZoom = Math.min(zoom * zoomFactor, 3.0);
        } else {
            // Zoom Out
            newZoom = Math.max(zoom / zoomFactor, 0.4);
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const factor = newZoom / zoom;
        setPanX(mouseX - (mouseX - panX) * factor);
        setPanY(mouseY - (mouseY - panY) * factor);
        setZoom(newZoom);
    };

    const centerY = dimensions.height / 2;
    const startX = 80;
    const usableWidth = 2400; // Fixed wide layout to prevent station overlap
    const endX = startX + usableWidth;

    // Label TextStyle
    const stationLabelStyle = {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        fill: '#ffffff',
        fontWeight: '900' as const,
        letterSpacing: 1
    };

    const stationPaxStyle = (pax: number) => ({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        fill: pax > 150 ? '#f43f5e' : pax > 60 ? '#f59e0b' : '#10b981',
        fontWeight: '900' as const
    });

    const trainLabelStyle = (isManual: boolean) => ({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        fill: isManual ? '#c084fc' : '#ffffff',
        fontWeight: '900' as const,
        stroke: '#0f172a',
        strokeThickness: 4
    });

    const trainStateStyle = (state: string) => ({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 10,
        fill: state === 'EMERGENCY' ? '#f43f5e' : state === 'DWELL' ? '#f59e0b' : state === 'RESTRICTED_MANUAL' ? '#c084fc' : '#3b82f6',
        fontWeight: '900' as const,
        stroke: '#0f172a',
        strokeThickness: 3
    });

    return (
        <div 
            className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
        >
            <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundAlpha: 1, backgroundColor: 0x090d16 }}>
                <Container x={panX} y={panY} scale={{ x: zoom, y: zoom }}>
                    {/* 1. Double Tracks Drawing */}
                    <Graphics draw={(g) => {
                        g.clear();
                        
                        // Track wear breakdown animation helper
                        const trackAnomaly = anomalies ? anomalies.find(a => a.trainId === 'TRACK') : null;
                        const hasTrackAnomaly = !!trackAnomaly;
                        const isTrackBlinking = hasTrackAnomaly && Math.sin(Date.now() / 150) > 0;
                        const eastTrackColor = isTrackBlinking ? 0xef4444 : 0x2563eb;
                        const westTrackColor = isTrackBlinking ? 0xef4444 : 0x059669;

                        // Subtle background HUD grid
                        g.lineStyle(1, 0x1e293b, 0.15);
                        const gridSpacing = 40;
                        for (let gridX = -2000; gridX < dimensions.width + 2000; gridX += gridSpacing) {
                            g.moveTo(gridX, -1000);
                            g.lineTo(gridX, dimensions.height + 1000);
                        }
                        for (let gridY = -1000; gridY < dimensions.height + 1000; gridY += gridSpacing) {
                            g.moveTo(-2000, gridY);
                            g.lineTo(dimensions.width + 2000, gridY);
                        }
                        
                        // Eastbound Track (Direction = 1) at y = centerY - 60
                        g.lineStyle(12, eastTrackColor, 1);
                        g.moveTo(startX, centerY - 60);
                        g.lineTo(endX, centerY - 60);

                        // Westbound Track (Direction = -1) at y = centerY + 60
                        g.lineStyle(12, westTrackColor, 1);
                        g.moveTo(startX, centerY + 60);
                        g.lineTo(endX, centerY + 60);

                        // Depot Track at y = centerY + 120
                        g.lineStyle(10, 0x475569, 1); // Slate
                        g.moveTo(startX, centerY + 120);
                        g.lineTo(endX, centerY + 120);
                        
                        // Connectors/catenary poles at stations
                        stations.forEach(st => {
                            const isLocked = !isRouteExtended && st.position > 2400;
                            const color = isLocked ? 0x1e293b : 0x475569;
                            const alpha = isLocked ? 0.2 : 0.8;
                            const x = startX + (st.position / 5000) * usableWidth;
                            g.lineStyle(4, color, alpha);
                            g.moveTo(x, centerY - 60);
                            g.lineTo(x, centerY + 60);
                        });
                    }} />

                    {/* 2. Stations Drawing */}
                    {stations.map(st => {
                        const isLocked = !isRouteExtended && st.position > 2400;
                        const x = startX + (st.position / 5000) * usableWidth;
                        const invScale = 1 / zoom;

                        // Dynamic passenger load halo configuration
                        const phase = (Date.now() % 1500) / 1500;
                        let haloColor = 0x10b981; // green
                        let nodeOutlineColor = 0x3b82f6; // blue
                        if (isLocked) {
                            nodeOutlineColor = 0x1e293b;
                        } else if (st.pax >= 120) {
                            haloColor = 0xef4444; // red
                            nodeOutlineColor = 0xef4444;
                        } else if (st.pax >= 50) {
                            haloColor = 0xf59e0b; // yellow/orange
                            nodeOutlineColor = 0xf59e0b;
                        } else {
                            nodeOutlineColor = 0x10b981; // green
                        }

                        return (
                            <Container key={st.name} x={x} y={centerY}>
                                <Container scale={{ x: invScale, y: invScale }}>
                                    {/* Pulsing halo indicating passenger wait levels */}
                                    {!isLocked && (
                                        <Graphics draw={(g) => {
                                            g.clear();
                                            g.lineStyle(3, haloColor, (0.7 - phase * 0.5));
                                            g.drawCircle(0, 0, 18 + phase * 22);
                                        }} />
                                    )}

                                    {/* Clean schematic station dot and passenger dots */}
                                    <Graphics draw={(g) => {
                                        g.clear();
                                        // Thick outer border
                                        g.lineStyle(4, nodeOutlineColor, isLocked ? 0.3 : 1);
                                        g.beginFill(0x0a0f1d, isLocked ? 0.5 : 1); // Sleek dark center core
                                        g.drawCircle(0, 0, 16);
                                        g.endFill();

                                        // Draw passengers as dots on the platform (bottleneck visual)
                                        const numDots = Math.min(st.pax, 200);
                                        g.beginFill(0x94a3b8, 0.8);
                                        g.lineStyle(0);
                                        for (let i = 0; i < numDots; i++) {
                                            // Golden angle spiral for organic distribution
                                            const angle = (i * 137.508) * (Math.PI / 180);
                                            const radius = 6 + Math.sqrt(i) * 1.5; // Tightly packed in center
                                            const px = Math.cos(angle) * radius;
                                            const py = Math.sin(angle) * radius;
                                            // Compress y to make it look like a platform along the track
                                            g.drawCircle(px, py * 0.5, 2.0);
                                        }
                                        g.endFill();
                                    }} />

                                    {/* Station Name Label */}
                                    <Text
                                        text={st.name.toUpperCase()}
                                        anchor={{ x: 0.5, y: 0 }}
                                        y={30}
                                        style={new TextStyle({
                                            ...stationLabelStyle,
                                            fill: isLocked ? '#475569' : '#ffffff'
                                        })}
                                    />

                                    {/* Passenger Queue counter */}
                                    {!isLocked && (
                                        <Text
                                            text={`${Math.floor(st.pax)} PAX`}
                                            anchor={{ x: 0.5, y: 0 }}
                                            y={50}
                                            style={new TextStyle(stationPaxStyle(st.pax))}
                                        />
                                    )}
                                </Container>
                            </Container>
                        );
                    })}

                    {/* 3. Trains Drawing */}
                    {trains.map(train => {
                        let x = startX + (train.position / 5000) * usableWidth;
                        let y = train.direction === 1 ? centerY - 60 : centerY + 60;
                        
                        if (train.state === 'DEPOT') {
                            y = centerY + 120;
                            const depotIndex = trains.filter(t => t.state === 'DEPOT').findIndex(t => t.id === train.id);
                            x = startX + (depotIndex * 90); // Space them out in the depot
                        }

                        // Check for anomalies on this train
                        const trainAnoms = anomalies ? anomalies.filter(a => a.trainId === train.id) : [];
                        const hasFailure = trainAnoms.some(a => a.failed);
                        const hasWarning = trainAnoms.some(a => !a.failed && a.detected);
                        const blink = Math.sin(Date.now() / 150) > 0;
                        const invScale = 1 / zoom;
                        
                        return (
                            <Container
                                key={train.id}
                                x={x}
                                y={y}
                                interactive={true as any}
                                pointerdown={() => onTrainClick(train.id)}
                                pointerover={() => handleTrainPointerOver(train.id)}
                                pointerout={handleTrainPointerOut}
                                cursor={"pointer" as any}
                            >
                                <Container scale={{ x: invScale, y: invScale }}>
                                    {/* Open doors glow indicator */}
                                    {train.state === 'DWELL' && (
                                        <Graphics draw={(g) => {
                                            g.clear();
                                            g.lineStyle(1, 0xf59e0b, 0.4);
                                            g.beginFill(0xf59e0b, 0.15);
                                            g.drawCircle(0, 0, 36);
                                            g.endFill();
                                        }} />
                                    )}

                                    {/* Animated boarding passenger particles */}
                                    {train.state === 'DWELL' && (
                                        <Container>
                                            {[...Array(3)].map((_, idx) => {
                                                const phase = ((Date.now() / 1000) + idx * 0.33) % 1.0;
                                                const startY = centerY - y; // distance relative to train height
                                                const particleY = startY + (0 - startY) * phase;
                                                
                                                return (
                                                    <Graphics
                                                        key={idx}
                                                        draw={(g) => {
                                                            g.clear();
                                                            g.beginFill(0x10b981, 0.8 - phase * 0.5); // fades as it moves to train
                                                            g.drawCircle(0, particleY, 3.0);
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
                                            const pulseAlpha = Math.sin(Date.now() / 150) * 0.15 + 0.25;
                                            g.lineStyle(2, 0xef4444, 0.8);
                                            g.beginFill(0xef4444, pulseAlpha);
                                            g.drawCircle(0, 0, 38);
                                            g.endFill();
                                        }} />
                                    )}

                                    {/* Sleek vector train shape */}
                                    <Graphics draw={(g) => {
                                        g.clear();
                                        
                                        // Determine state color
                                        let color = 0xf8fafc; // Normal running (sleek silver/white)
                                        let borderColor = 0x0f172a; // Dark border for contrast
                                        let borderThickness = 2;
                                        
                                        if (hasFailure) {
                                            const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
                                            color = pulse > 0.5 ? 0xef4444 : 0xb91c1c; // Pulsing red body
                                            borderColor = 0xfc8181;
                                            borderThickness = 3 + Math.floor(pulse * 3); // Pulsing border thickness
                                        } else if (train.state === 'EMERGENCY') {
                                            color = 0xef4444; // Emergency (red)
                                            borderColor = 0xef4444;
                                        } else if (train.state === 'DWELL') {
                                            color = 0xf59e0b; // Dwell (orange)
                                            borderColor = 0xf59e0b;
                                        } else if (train.isManualOverride) {
                                            color = 0xa855f7; // Manual override (purple)
                                            borderColor = 0xa855f7;
                                        }

                                        // Train body (rounded rectangle)
                                        g.beginFill(color, 1);
                                        g.lineStyle(borderThickness, borderColor, 1.0);
                                        g.drawRoundedRect(-28, -10, 56, 20, 6);
                                        g.endFill();

                                        // Front window (pointing direction)
                                        g.beginFill(0x0f172a, 1);
                                        if (train.direction === 1) {
                                            // Pointing right
                                            g.drawRect(18, -6, 6, 12);
                                        } else {
                                            // Pointing left
                                            g.drawRect(-24, -6, 6, 12);
                                        }
                                        g.endFill();
                                        
                                        // Passenger load bar inside train body
                                        const fillRatio = Math.min(1.0, train.passengerCount / train.maxCapacity);
                                        if (fillRatio > 0) {
                                            g.lineStyle(0);
                                            g.beginFill(0x3b82f6, 0.8); // Blue inner load bar
                                            g.drawRect(-20, 4, 40 * fillRatio, 4);
                                            g.endFill();
                                        }
                                    }} />
                                </Container>
                            </Container>
                        );
                    })}

                    {/* 4. Floating Money Popups */}
                    {moneyPopups.map(popup => {
                        const now = Date.now();
                        const elapsed = now - popup.timestamp;
                        const progress = Math.min(1.0, elapsed / 2000);
                        const x = startX + (popup.x / 5000) * usableWidth;
                        const y = (centerY - 20) - (progress * 50); // Float up 50 pixels
                        const invScale = 1 / zoom;
                        
                        const popupStyle = {
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: 18,
                            fill: '#10b981', // Emerald green
                            fontWeight: '900' as const,
                            stroke: '#064e3b',
                            strokeThickness: 4,
                            dropShadow: true,
                            dropShadowAlpha: 0.5 - (progress * 0.5),
                            dropShadowDistance: 2
                        };

                        return (
                            <Container key={popup.id} x={x} y={y} scale={{ x: invScale, y: invScale }}>
                                <Text
                                    text={`+$${Math.round(popup.amount)}`}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                    style={new TextStyle(popupStyle)}
                                    alpha={1.0 - Math.pow(progress, 3)} // Fade out slowly, then fast at the end
                                />
                            </Container>
                        );
                    })}
                </Container>
            </Stage>
            
            {/* Zoom Controls HUD - bottom right corner */}
            <div 
                className="absolute bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => {
                        const newZoom = Math.min(zoom * 1.2, 3.0);
                        const factor = newZoom / zoom;
                        const centerX = dimensions.width / 2;
                        const centerY = dimensions.height / 2;
                        setPanX(centerX - (centerX - panX) * factor);
                        setPanY(centerY - (centerY - panY) * factor);
                        setZoom(newZoom);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white border border-white/10 shadow-lg flex items-center justify-center font-bold text-lg transition-all active:scale-95 cursor-pointer"
                    title="Zoom ind"
                >
                    +
                </button>
                <button
                    onClick={() => {
                        const newZoom = Math.max(zoom / 1.2, 0.4);
                        const factor = newZoom / zoom;
                        const centerX = dimensions.width / 2;
                        const centerY = dimensions.height / 2;
                        setPanX(centerX - (centerX - panX) * factor);
                        setPanY(centerY - (centerY - panY) * factor);
                        setZoom(newZoom);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white border border-white/10 shadow-lg flex items-center justify-center font-bold text-lg transition-all active:scale-95 cursor-pointer"
                    title="Zoom ud"
                >
                    −
                </button>
                <button
                    onClick={() => {
                        setZoom(1.0);
                        setPanX(0);
                        setPanY(0);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-emerald-400 border border-white/10 shadow-lg flex items-center justify-center text-lg transition-all active:scale-95 cursor-pointer"
                    title="Nulstil visning"
                >
                    🎯
                </button>
            </div>

            {/* Interactive hover card tooltip overlay for train miniature dashboard */}
            {hoveredTrainId && (() => {
                const train = trains.find(t => t.id === hoveredTrainId);
                if (!train) return null;

                // Calculate exact position on screen
                let x = startX + (train.position / 5000) * usableWidth;
                let y = train.direction === 1 ? centerY - 60 : centerY + 60;
                
                if (train.state === 'DEPOT') {
                    y = centerY + 120;
                    const depotIndex = trains.filter(t => t.state === 'DEPOT').findIndex(t => t.id === train.id);
                    x = startX + (depotIndex * 90);
                }

                const screenX = x * zoom + panX;
                const screenY = y * zoom + panY;

                // Find anomalies for this train
                const trainAnoms = anomalies ? anomalies.filter(a => a.trainId === train.id) : [];
                const failureAnom = trainAnoms.find(a => a.failed);
                const warningAnom = trainAnoms.find(a => !a.failed && a.detected);
                const activeAnom = failureAnom || warningAnom;

                return (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${screenX}px`,
                            top: `${screenY - 14}px`, // Display above train icon
                            transform: 'translate(-50%, -100%)',
                        }}
                        className="pointer-events-auto z-[200] flex flex-col items-center gap-1.5 drop-shadow-2xl select-text"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseLeave={handleCardMouseLeave}
                    >
                        {/* Glassmorphism card dashboard */}
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 w-52 flex flex-col gap-2 text-left shadow-2xl transition-all duration-300">
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                                <span className="font-extrabold text-sm text-white flex items-center gap-1">
                                    <Hammer size={12} className="text-blue-450" /> {train.id}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                    train.state === 'DEPOT' 
                                    ? 'bg-slate-800 text-slate-400' 
                                    : train.state === 'EMERGENCY'
                                        ? 'bg-rose-950/60 text-rose-450 border border-rose-500/20'
                                        : train.state === 'DWELL'
                                            ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                    {train.state === 'DEPOT' ? 'Depot' : train.state === 'EMERGENCY' ? 'Emergency' : train.state === 'DWELL' ? 'Dwell' : 'I Drift'}
                                </span>
                            </div>

                            {/* Passenger capacity progress bar */}
                            <div className="flex flex-col gap-1 text-[12px]">
                                <div className="flex justify-between text-slate-400">
                                    <span className="flex items-center gap-1"><Users size={10} /> Belastning:</span>
                                    <span className="font-bold text-white font-mono">{train.passengerCount}/{train.maxCapacity} PAX</span>
                                </div>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${(train.passengerCount / train.maxCapacity) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Anomaly / Error State */}
                            {activeAnom && (
                                <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5">
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-rose-400 animate-pulse">
                                        <AlertTriangle size={11} />
                                        <span>{activeAnom.failed ? 'KRITISK FEJL' : 'ANOMALI'} DETEKTERET</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold italic">Klik på toget for at udbedre</span>
                                </div>
                            )}
                        </div>
                        {/* Tooltip arrow */}
                        <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700/80 transform rotate-45 -mt-2"></div>
                    </div>
                );
            })()}
        </div>
    );
};

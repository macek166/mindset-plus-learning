import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize2, RefreshCw, ArrowUpRight, ArrowUpLeft, ArrowDownLeft, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type TuningChannel = 'TECHNICAL' | 'CONTEXT' | 'CONCEPTS';

interface TuningState {
    depth: number;
    breadth: number;
}

interface KnowledgeTunerProps {
    onTune: (tuning: Record<TuningChannel, TuningState>) => void;
    isLoading: boolean;
}

const CHANNELS: { id: TuningChannel; label: string; color: string }[] = [
    { id: 'TECHNICAL', label: 'Technický text', color: 'text-cyan-400' },
    { id: 'CONTEXT', label: 'Historický Kontext', color: 'text-violet-400' },
    { id: 'CONCEPTS', label: 'Koncepty a Teorie', color: 'text-indigo-400' }
];

export function KnowledgeTuner({ onTune, isLoading }: KnowledgeTunerProps) {
    const [activeChannel, setActiveChannel] = useState<TuningChannel>('TECHNICAL');
    const [state, setState] = useState<Record<TuningChannel, TuningState>>({
        TECHNICAL: { depth: 0, breadth: 0 },
        CONTEXT: { depth: 0, breadth: 0 },
        CONCEPTS: { depth: 0, breadth: 0 }
    });

    const activeState = state[activeChannel];

    const handleMove = (dx: number, dy: number) => {
        const newState = { ...state };
        const current = newState[activeChannel];

        newState[activeChannel] = {
            depth: Math.max(-5, Math.min(5, current.depth + dy)),
            breadth: Math.max(-5, Math.min(5, current.breadth + dx))
        };

        setState(newState);
        onTune(newState);
    };

    // Calculate position percent for the dot (range -5 to 5 maps to 0% to 100%)
    const toPercent = (val: number) => ((val + 5) / 10) * 100;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full shadow-2xl relative overflow-hidden flex flex-col gap-6">

            {/* 1. Parameter Selection */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3">
                    Vyber Parametr k Ladění
                </h3>
                <div className="flex flex-col gap-1">
                    {CHANNELS.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel.id)}
                            className={cn(
                                "text-left text-sm font-bold transition-all px-3 py-2 rounded-lg flex justify-between items-center group border border-transparent",
                                activeChannel === channel.id
                                    ? `bg-slate-800 ${channel.color} border-slate-700 shadow-inner`
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                            )}
                        >
                            <span>{channel.label}</span>
                            {/* Value Indicator Mini tag */}
                            {(state[channel.id].depth !== 0 || state[channel.id].breadth !== 0) && (
                                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono opacity-70 group-hover:opacity-100">
                                    {state[channel.id].breadth > 0 ? '+' : ''}{state[channel.id].breadth} / {state[channel.id].depth > 0 ? '+' : ''}{state[channel.id].depth}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Graph Area (Visualizing Active Channel) */}
            <div className="relative aspect-square bg-slate-950 border border-slate-800 rounded-lg overflow-hidden group shadow-inner">
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
                    {[...Array(4)].map((_, i) => <div key={i} className="border-r border-slate-700 h-full w-full" />)}
                    {[...Array(4)].map((_, i) => <div key={'r' + i} className="border-b border-slate-700 h-full w-full" />)}
                </div>

                {/* Axis Lines */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700" />

                {/* Axis Labels */}
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">Hloubka +</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">Hloubka -</span>
                <span className="absolute bottom-8 right-2 text-[9px] text-slate-600 font-bold uppercase rotate-90">Šířka -</span>
                <span className="absolute bottom-8 left-2 text-[9px] text-slate-600 font-bold uppercase -rotate-90">Šířka +</span>

                {/* The Active Dot */}
                <div
                    className={cn(
                        "absolute w-4 h-4 rounded-full border-2 border-white transition-all duration-500 ease-out z-20 shadow-[0_0_15px_currentColor]",
                        activeChannel === 'TECHNICAL' ? "bg-cyan-500 text-cyan-500" :
                            activeChannel === 'CONTEXT' ? "bg-violet-500 text-violet-500" : "bg-indigo-500 text-indigo-500"
                    )}
                    style={{
                        left: `${toPercent(activeState.breadth)}%`,
                        bottom: `${toPercent(activeState.depth)}%`,
                        transform: 'translate(-50%, 50%)'
                    }}
                />

                {/* Connection Lines (Radar Style) */}
                <div
                    className={cn(
                        "absolute border-l border-b transition-all duration-500 opacity-30",
                        activeChannel === 'TECHNICAL' ? "border-cyan-500" :
                            activeChannel === 'CONTEXT' ? "border-violet-500" : "border-indigo-500"
                    )}
                    style={{
                        left: '50%', bottom: '50%',
                        width: `${Math.abs(activeState.breadth * 10)}%`,
                        height: `${Math.abs(activeState.depth * 10)}%`,
                        transform: `scale(${activeState.breadth >= 0 ? 1 : -1}, ${activeState.depth >= 0 ? 1 : -1})`,
                        transformOrigin: 'bottom left'
                    }}
                />

                {/* Ghost Dots (Other Channels) */}
                {CHANNELS.filter(c => c.id !== activeChannel).map(c => {
                    const s = state[c.id];
                    if (s.depth === 0 && s.breadth === 0) return null;
                    return (
                        <div
                            key={c.id}
                            className={cn("absolute w-2 h-2 rounded-full opacity-40 z-10 transition-all duration-500",
                                c.id === 'TECHNICAL' ? "bg-cyan-500" : c.id === 'CONTEXT' ? "bg-violet-500" : "bg-indigo-500"
                            )}
                            style={{
                                left: `${toPercent(s.breadth)}%`,
                                bottom: `${toPercent(s.depth)}%`,
                                transform: 'translate(-50%, 50%)'
                            }}
                        />
                    )
                })}

                {/* CORNER CONTROLS */}
                <div className="absolute top-2 right-2 z-30">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleMove(1, 1)} disabled={isLoading} className={cn("w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95", activeChannel === 'TECHNICAL' ? "bg-cyan-950/50 text-cyan-400 hover:bg-cyan-900/80" : activeChannel === 'CONTEXT' ? "bg-violet-950/50 text-violet-400 hover:bg-violet-900/80" : "bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900/80")}>
                                    <ArrowUpRight className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Hloubka + / Šířka +</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="absolute top-2 left-2 z-30">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleMove(-1, 1)} disabled={isLoading} className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95">
                                    <ArrowUpLeft className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Hloubka + / Šířka -</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="absolute bottom-2 left-2 z-30">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleMove(-1, -1)} disabled={isLoading} className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95">
                                    <ArrowDownLeft className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Hloubka - / Šířka -</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="absolute bottom-2 right-2 z-30">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleMove(1, -1)} disabled={isLoading} className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95">
                                    <ArrowDownRight className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Hloubka - / Šířka +</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* 3. Controls */}
            <div className="grid grid-cols-3 gap-2 relative">
                <div />

                <div />
                <button disabled={isLoading} onClick={() => handleMove(0, 1)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 flex justify-center border border-slate-700/50"><ArrowUp className="w-4 h-4" /></button>
                <div />

                <button disabled={isLoading} onClick={() => handleMove(-1, 0)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 flex justify-center border border-slate-700/50"><ArrowLeft className="w-4 h-4" /></button>
                <div className="flex items-center justify-center">
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                </div>
                <button disabled={isLoading} onClick={() => handleMove(1, 0)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 flex justify-center border border-slate-700/50"><ArrowRight className="w-4 h-4" /></button>

                <div />
                <button disabled={isLoading} onClick={() => handleMove(0, -1)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 flex justify-center border border-slate-700/50"><ArrowDown className="w-4 h-4" /></button>
                <div />
            </div>

            <div className="text-[10px] text-center text-slate-500 font-mono">
                {activeChannel}: X:{activeState.breadth} | Y:{activeState.depth}
            </div>
        </div>
    );
}

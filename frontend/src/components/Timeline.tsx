import React from 'react';
import { Node } from '@/types';
import { Check, Lock, Play, AlertCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TimelineProps {
    nodes: Node[];
    onNodeClick: (nodeId: string) => void;
    selectedNodeId?: string;
}

interface TreeNode extends Node {
    children: TreeNode[];
}

export function Timeline({ nodes, onNodeClick, selectedNodeId }: TimelineProps) {
    // Build Tree Structure
    const buildTree = (inputNodes: Node[]): TreeNode[] => {
        const nodeMap = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        // Sort by creation to ensure proper order A -> B -> C
        // Assuming backend returns created_at asc
        const sortedNodes = [...inputNodes].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        sortedNodes.forEach(n => {
            nodeMap.set(n.id, { ...n, children: [] });
        });

        sortedNodes.forEach(n => {
            const treeNode = nodeMap.get(n.id)!;
            if (n.parent_node_id && nodeMap.has(n.parent_node_id)) {
                // Here we need to be careful.
                // If depth_level > 1, it is a remedial child of the previous node.
                // If depth_level == 1, it is the NEXT main step.
                // BUT logic in backend: 
                // Main Chain: A -> B -> C (linked via parent_node_id?)
                // Wait, backend logic for Main Chain:
                // Node A (parent=None), Node B (parent=A), Node C (parent=B)...
                // This creates a deep nested structure for the main chain too!

                // This is tricky. User wants A -> B -> C horizontal.
                // But data structure is A.children -> B.
                // Remedial nodes are also children.

                // Solution:
                // We need to distinguish "Next Main Step" vs "Remedial Step".
                // Backend `depth_level` fix:
                // Main steps have depth_level = 1.
                // Remedial steps have depth_level > 1.

                if (n.depth_level === 1) {
                    // It's a main node. Don't nest it under previous main node for VISUALIZATION, 
                    // but treat it as a sibling root for the horizontal axis.
                    roots.push(treeNode);
                    // Note: In DB B is child of A. But we flatten the main axis here.
                } else {
                    // It is remedial (depth > 1), so it goes UNDER its parent.
                    // Parent MUST be in the map.
                    nodeMap.get(n.parent_node_id)!.children.push(treeNode);
                }
            } else {
                roots.push(treeNode);
            }
        });

        // We might have duplicates if we push everything depth=1 to roots.
        // The previous loop pushed roots (parent=null).
        // Now we need to collect the chain A -> B -> C if they are depth=1 but linked.

        // Let's redefine:
        // Roots = All depth=1 nodes.
        // Children of a Root = Only its remedial nodes (depth > 1).
        return roots.filter(r => r.depth_level === 1);
    };

    const tree = buildTree(nodes);

    const StatusMaker = ({ node, isActive }: { node: TreeNode, isActive: boolean }) => {
        const level = node.repetition_level || 0;
        const status = node.status;

        let colorClass = "bg-slate-800 text-slate-500 border-slate-700";
        let icon = <Circle className="w-3 h-3" />;
        let glowClass = "";

        if (status === 'LOCKED') {
            icon = <Lock className="w-3 h-3" />;
        } else if (level === 0) {
            // Blue - First Learning
            colorClass = "bg-cyan-500 text-white border-cyan-400";
            glowClass = "shadow-[0_0_15px_rgba(6,182,212,0.5)]";
            icon = <Play className="w-3 h-3 fill-current" />;
        } else if (level === 1) {
            // Purple - 24h Review
            colorClass = "bg-purple-500 text-white border-purple-400";
            glowClass = "shadow-[0_0_15px_rgba(168,85,247,0.5)]";
            icon = <span className="text-xs font-bold">1</span>;
        } else if (level === 2) {
            // Yellow - 4d Review
            colorClass = "bg-yellow-500 text-white border-yellow-400";
            glowClass = "shadow-[0_0_15px_rgba(234,179,8,0.5)]";
            icon = <span className="text-xs font-bold">2</span>;
        } else if (level >= 3) {
            // Green - Mastered
            colorClass = "bg-green-500 text-white border-green-400";
            glowClass = "shadow-[0_0_15px_rgba(34,197,94,0.5)]";
            icon = <Check className="w-4 h-4" />;
        }

        // Timer/Lock logic overrides visual if locked by timer?
        // User says: "od stavu fialového může mít uživatel otevřený i následující kapitolu".
        // The node itself is visible/colored, but maybe "dimmed" if waiting?
        // Actually, if it's waiting, it's just NOT clickable for test? Or clickable to see timer?

        return (
            <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 relative",
                colorClass,
                isActive ? "ring-4 ring-white/10 scale-110" : "hover:scale-105",
                isActive && glowClass
            )}>
                {icon}
            </div>
        );
    };

    const MiniNode = ({ node }: { node: TreeNode }) => {
        const isActive = selectedNodeId === node.id;

        // Timer Logic
        const now = new Date();
        const reviewDate = node.next_review_at ? new Date(node.next_review_at) : null;
        const isWaiting = reviewDate && reviewDate > now && (node.repetition_level || 0) > 0;
        let timeLabel = "";

        if (isWaiting && reviewDate) {
            const diff = reviewDate.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (days > 0) timeLabel = `${days}d ${hours}h`;
            else timeLabel = `${hours}h`;
        }

        // Remedial Logic: Find deep active remedial node and depth
        const getDeepestRemedial = (inputNode: TreeNode): { node: TreeNode, count: number } => {
            if (!inputNode.children || inputNode.children.length === 0) {
                return { node: inputNode, count: 0 };
            }

            const sorted = [...inputNode.children]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Only follow depth > 1 (remedial nodes)
            const remedialChildren = sorted.filter(c => c.depth_level > 1);

            if (remedialChildren.length === 0) return { node: inputNode, count: 0 };

            const lastChild = remedialChildren[remedialChildren.length - 1];

            // Recursively go deeper
            const childResult = getDeepestRemedial(lastChild);
            return { node: childResult.node, count: childResult.count + 1 };
        };

        const { node: deepNode, count: roundNumber } = getDeepestRemedial(node);
        const latestRemedial = roundNumber > 0 ? deepNode : null;

        // Main Node Click Handler
        // If waiting (Timer), user can still click to see timer info but maybe distinct action?
        // User: "od stavu fialového může mít uživatel otevřený i následující kapitolu".
        // So clicking is allowed.

        return (
            <div className="flex flex-col items-center relative gap-2">
                {/* Main Circle */}
                <div className="relative group">
                    {/* Timer Label */}
                    {isWaiting && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 border border-purple-500/30 rounded-full px-2 py-0.5 z-50 shadow-[0_0_10px_rgba(0,0,0,0.5)] whitespace-nowrap pointer-events-none">
                            <span className="text-[10px] font-mono text-purple-400 font-bold flex items-center gap-1">
                                ⏳ {timeLabel}
                            </span>
                        </div>
                    )}

                    <TooltipProvider>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <div
                                    onClick={() => onNodeClick(node.id)}
                                    className="relative cursor-pointer"
                                >
                                    <StatusMaker node={node} isActive={isActive} />

                                    <div className="mt-2 w-32 text-center">
                                        <p className={cn(
                                            "text-xs font-bold truncate transition-colors",
                                            isActive ? "text-cyan-400" : "text-slate-400"
                                        )}>
                                            {node.title}
                                        </p>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-800 text-slate-200">
                                <p className="font-bold">{node.title}</p>
                                {isWaiting && <p className="text-xs text-purple-400">Příští opakování za {timeLabel}</p>}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Vertical Remedial Point (Single Dot with Loop Count) */}
                {latestRemedial && (
                    <div className="flex flex-col items-center animate-in slide-in-from-top-2">
                        {/* Connection Line */}
                        <div className="w-0.5 h-6 bg-slate-800" />

                        <TooltipProvider>
                            <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => onNodeClick(latestRemedial.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition bg-slate-950 z-10 shadow-lg",
                                            latestRemedial.status === 'DONE' ? "border-green-500 text-green-500" : "border-orange-500 text-orange-500",
                                            selectedNodeId === latestRemedial.id ? "ring-2 ring-white/20 scale-110" : ""
                                        )}
                                    >
                                        <span className="text-xs font-bold">{roundNumber}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 border-slate-800">
                                    <p className="font-bold text-orange-400">Doučování: Pokus č. {roundNumber}</p>
                                    <p className="text-xs text-slate-500">{latestRemedial.title}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full overflow-x-auto py-8 px-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <div className="flex items-start gap-0 min-w-max mx-auto justify-center">
                {tree.map((root, index) => (
                    <div key={root.id} className="flex items-start">

                        {/* The Node Config */}
                        <MiniNode node={root} />

                        {/* Horizontal Connector to Next Main Node */}
                        {index < tree.length - 1 && (
                            <div className="h-[2px] w-12 bg-slate-800 mt-[20px] -mx-2 z-0" />
                        )}
                    </div>
                ))}

                {/* End Point Goal Flag */}
                {tree.length > 0 && (
                    <>
                        <div className="h-[2px] w-12 bg-slate-800 mt-[20px] -ml-2 z-0" />
                        <div className="flex flex-col items-center opacity-50">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-dashed flex items-center justify-center bg-slate-950 mt-0">
                                <Check className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 mt-2">CÍL</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

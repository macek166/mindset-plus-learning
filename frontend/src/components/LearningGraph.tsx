"use client";

import React, { useCallback } from 'react';
import { Node as AppNode, Edge as AppEdge } from '@/types';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge as FlowEdge,
    Node as FlowNode,
    Position,
    Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lock, FolderOpen, CheckCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Custom Node Component ---

const NodeComponent = ({ data }: { data: any }) => {
    const status = data.status || 'LOCKED';
    const repLevel = data.repetition_level || 0;
    const nextReview = data.next_review_at ? new Date(data.next_review_at) : null;
    const isDue = nextReview && nextReview < new Date() && status === 'DONE';

    const statusConfig = {
        LOCKED: { color: 'bg-gray-200 border-gray-400', icon: <Lock className="w-4 h-4 text-gray-500" /> },
        OPEN: { color: 'bg-blue-100 border-blue-500', icon: <FolderOpen className="w-4 h-4 text-blue-600" /> },
        POTENTIAL: { color: 'bg-yellow-100 border-yellow-500', icon: <HelpCircle className="w-4 h-4 text-yellow-600" /> },
        DONE: { color: 'bg-green-100 border-green-500', icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
        GOOD: { color: 'bg-emerald-100 border-emerald-500', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.LOCKED;

    // Override border if due
    const finalClass = cn(
        "px-4 py-2 shadow-md rounded-md border-2 w-48 relative transition-all duration-300",
        config.color,
        isDue && "border-orange-500 ring-2 ring-orange-200"
    );

    return (
        <div className={finalClass}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />

            {/* Header / Status Icon */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    {config.icon}
                    {isDue && (
                        <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                            REVIEW
                        </span>
                    )}
                </div>
                {repLevel > 0 && (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/50 px-1 rounded">
                        LVL {repLevel}
                    </span>
                )}
            </div>

            <div className="font-bold text-sm text-gray-800 leading-tight">
                {data.label}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
        </div>
    );
};

const nodeTypes = {
    custom: NodeComponent,
};

// --- Main Component ---

interface LearningGraphProps {
    nodes: AppNode[];
    edges: AppEdge[];
    onNodeClick: (nodeId: string) => void;
}

export function LearningGraph({ nodes: initialNodesData, edges: initialEdgesData, onNodeClick }: LearningGraphProps) {
    // Transform DB nodes to React Flow nodes
    const flowNodes: FlowNode[] = initialNodesData.map(node => ({
        id: node.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // TODO: Implement layout algorithm (e.g. dagre)
        data: {
            label: node.title,
            status: node.status,
            repetition_level: node.repetition_level,
            next_review_at: node.next_review_at
        }
    }));

    const flowEdges: FlowEdge[] = initialEdgesData.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true
    }));

    const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

    // Update effect when props change
    React.useEffect(() => {
        setNodes(initialNodesData.map((node, i) => ({
            id: node.id,
            type: 'custom',
            position: { x: (i % 3) * 250, y: Math.floor(i / 3) * 150 + 50 }, // Simple grid layout for now
            data: {
                label: node.title,
                status: node.status,
                repetition_level: node.repetition_level,
                next_review_at: node.next_review_at
            }
        })));
    }, [initialNodesData, setNodes]);

    React.useEffect(() => {
        setEdges(initialEdgesData.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: true
        })));
    }, [initialEdgesData, setEdges]);


    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div style={{ width: '100%', height: '500px' }} className="border rounded-lg shadow-sm bg-gray-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => onNodeClick(node.id)}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}

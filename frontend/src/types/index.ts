export type NodeStatus = 'LOCKED' | 'OPEN' | 'POTENTIAL' | 'GOOD' | 'DONE';

export interface Node {
    id: string;
    goal_id: string;
    parent_node_id: string | null;
    title: string;
    content_md: string | null;
    kpis: any;
    status: NodeStatus;
    next_review_at: string | null;
    depth_level: number;
    repetition_level: number;
    last_test_score: number | null;
    created_at: string;
}

export interface Edge {
    id: string;
    source: string;
    target: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const USER_ID = "822e5a23-0f00-4df3-a84e-dea4a5153b99"; // Real User ID from Supabase Auth

export async function evaluateAttempt(nodeId: string, userEssay: string) {
    const response = await fetch(`${API_URL}/evaluate_attempt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            node_id: nodeId,
            user_id: USER_ID,
            user_essay: userEssay,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Evaluation failed');
    }

    return response.json();
}

export async function createGoal(title: string, description: string, type: 'SKILL' | 'KNOWLEDGE', level: 'BASIC' | 'ADVANCED' | 'EXPERT') {
    const response = await fetch(`${API_URL}/create_goal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            goal_title: title,
            goal_description: description,
            goal_type: type,
            level: level,
            user_id: USER_ID
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create goal');
    }

    return response.json();
}

export async function deepenNode(
    nodeId: string,
    mode: 'GENERAL' | 'TECHNICAL' | 'CONTEXT' | 'CONCEPTS' | 'TUNING' = 'GENERAL',
    tuning?: Record<string, { depth: number, breadth: number }>
) {
    const response = await fetch(`${API_URL}/deepen_node`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            node_id: nodeId,
            mode: mode,
            tuning: tuning || {}
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to deepen content');
    }

    return response.json();
}

export async function getConcepts(nodeId?: string) {
    const url = `${API_URL}/user_concepts/${USER_ID}${nodeId ? `?node_id=${nodeId}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch concepts');
    }

    return response.json();
}

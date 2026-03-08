import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Repeat, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewNode {
    id: string;
    title: string;
    next_review_at: string;
    repetition_level: number;
    goal_id: string;
    goal: { title: string }[];
}

interface DueReviewsWidgetProps {
    onStartReview: (nodeId: string, goalId: string) => void;
}

export function DueReviewsWidget({ onStartReview }: DueReviewsWidgetProps) {
    const [reviews, setReviews] = useState<ReviewNode[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            const now = new Date().toISOString();

            // Fetch nodes due for review
            // Note: Supabase join syntax for goal title
            const { data, error } = await supabase
                .from('nodes')
                .select('id, title, next_review_at, repetition_level, goal_id, goal:goals(title)')
                .lte('next_review_at', now)
                .neq('status', 'LOCKED')
                .order('next_review_at', { ascending: true })
                .limit(5);

            if (data) {
                setReviews(data as any);
            }
            setIsLoading(false);
        };

        fetchReviews();

        // Refresh every minute
        const interval = setInterval(fetchReviews, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-emerald-400" />
                        Aktivní Opakování
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Lekce připravené k oživení paměti
                    </p>
                </div>
                {reviews.length > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                        {reviews.length} k dispozici
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="space-y-3 relative z-10">
                {reviews.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/50 mb-3 text-slate-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-medium text-sm">Vše hotovo!</p>
                        <p className="text-slate-600 text-xs mt-1">Žádné lekce k opakování.</p>
                    </div>
                ) : (
                    reviews.map(node => (
                        <button
                            key={node.id}
                            onClick={() => onStartReview(node.id, node.goal_id)}
                            className="w-full text-left bg-slate-800/30 hover:bg-slate-800 border border-slate-800/50 hover:border-violet-500/30 p-3 rounded-xl transition-all group flex justify-between items-center"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                                        LEVEL {node.repetition_level}
                                    </span>
                                    <span className="text-[10px] text-slate-600 truncate max-w-[100px]">
                                        {/* @ts-ignore */}
                                        {node.goal?.title}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate pr-2">
                                    {node.title}
                                </h4>
                            </div>

                            <div className="flex items-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

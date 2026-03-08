import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2, ArrowRight, BookOpen, Trophy } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { cn } from '@/lib/utils';
import { CreateGoalDialog } from './CreateGoalDialog';
import { KbWidget } from './KbWidget';
import { DueReviewsWidget } from './DueReviewsWidget';

interface Goal {
    id: string;
    title: string;
    type: 'SKILL' | 'KNOWLEDGE';
    created_at: string;
}

interface DashboardProjectsProps {
    onSelectProject: (goalId: string) => void;
    onGoalCreated: (goalId: string) => void;
    onNavigateToNode: (goalId: string, nodeId: string) => void;
}

export function DashboardProjects({ onSelectProject, onGoalCreated, onNavigateToNode }: DashboardProjectsProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGoals = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setGoals(data as any);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Opravdu smazat tento cíl a všechnu historii?")) return;

        await supabase.from('goals').delete().eq('id', id);
        fetchGoals();
    };

    return (
        <div className="max-w-7xl mx-auto py-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 mb-2">
                        Vítej v MindLoop
                    </h1>
                    <p className="text-slate-400">Přehled tvého učení a projektů.</p>
                </div>
                <CreateGoalDialog onGoalCreated={onGoalCreated} />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content - Projects (3 cols) */}
                <div className="lg:col-span-3">
                    <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                        Tvé Projekty
                    </h2>


                    {isLoading ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {goals.map(goal => (
                                <div
                                    key={goal.id}
                                    onClick={() => onSelectProject(goal.id)}
                                    className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800/50 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl"
                                >
                                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(e) => handleDelete(e, goal.id)}
                                            className="p-2 bg-slate-950 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition border border-slate-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mb-6 pr-8">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border mb-3 shadow-[0_0_10px_rgba(0,0,0,0.2)]",
                                            goal.type === 'SKILL'
                                                ? "bg-cyan-950/40 text-cyan-400 border-cyan-900/50 shadow-cyan-900/20"
                                                : "bg-violet-950/40 text-violet-400 border-violet-900/50 shadow-violet-900/20"
                                        )}>
                                            {goal.type === 'SKILL' ? <Trophy className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                            {goal.type === 'SKILL' ? "DOVEDNOST" : "ZNALOST"}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-100 group-hover:text-white transition line-clamp-2 leading-tight">
                                            {goal.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-2 font-mono">{new Date(goal.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-500 font-medium uppercase tracking-wider">
                                            <span>Progress</span>
                                            <span>0%</span>
                                        </div>
                                        <Progress value={0} className="h-1.5 bg-slate-950" indicatorClassName={goal.type === 'SKILL' ? "bg-cyan-500" : "bg-violet-500"} />
                                    </div>

                                    <div className="mt-6 flex items-center text-sm font-bold text-slate-500 group-hover:text-cyan-400 transition">
                                        Pokračovat <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                                    </div>
                                </div>
                            ))}

                            {/* Empty State */}
                            {goals.length === 0 && (
                                <div
                                    className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-60 min-h-[250px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4 text-slate-600">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-300 mb-1">Žádné projekty</h3>
                                    <p className="text-slate-500 text-sm">Vytvořte svůj první cíl nahoře.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Scaffolding */}
                <div className="lg:col-span-1 space-y-6">
                    <KbWidget />

                    <DueReviewsWidget onStartReview={() => { }} />

                    {/* Motivation / Streak Placeholder */}
                    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 text-center">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Denní cíl</h3>
                        <div className="text-2xl font-bold text-white mb-1">0 / 3</div>
                        <p className="text-slate-500 text-sm">lekcí dokončeno</p>
                        <Progress value={0} className="h-1 bg-slate-800 mt-4" indicatorClassName="bg-green-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { getConcepts } from '@/lib/api';
import { Loader2, BookOpen, Zap, User, GraduationCap, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

interface Concept {
    id: string;
    category: 'TERM' | 'THEORY' | 'PERSON' | 'SKILL';
}

const CATEGORIES = [
    { id: 'TERM', label: 'Pojmy', icon: BookOpen, color: 'text-cyan-400', progressColor: 'bg-cyan-500' },
    { id: 'THEORY', label: 'Teorie', icon: Zap, color: 'text-purple-400', progressColor: 'bg-purple-500' },
    { id: 'PERSON', label: 'Osobnosti', icon: User, color: 'text-amber-400', progressColor: 'bg-amber-500' },
    { id: 'SKILL', label: 'Dovednosti', icon: GraduationCap, color: 'text-emerald-400', progressColor: 'bg-emerald-500' },
] as const;

export function KbWidget() {
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getConcepts();
                setConcepts(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const total = concepts.length;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        Znalostní Báze
                        <Layers className="w-4 h-4 text-violet-500" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Uložené a zvládnuté koncepty
                    </p>
                </div>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-violet-500" /> : total}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4 relative z-10">
                {CATEGORIES.map(cat => {
                    const count = concepts.filter(c => c.category === cat.id).length;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    const Icon = cat.icon;

                    return (
                        <div key={cat.id} className="group/item">
                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                <span className={cn("flex items-center gap-1.5 transition-colors", cat.color)}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </span>
                                <span className="text-slate-500 group-hover/item:text-slate-300 transition-colors">
                                    {count} <span className="opacity-40 text-[10px] ml-0.5">({percentage}%)</span>
                                </span>
                            </div>
                            <Progress
                                value={percentage}
                                className="h-1.5 bg-slate-950 border border-slate-800/50"
                                indicatorClassName={cn("transition-all duration-500", cat.progressColor, "shadow-[0_0_10px_rgba(0,0,0,0.3)]")}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none group-hover:bg-violet-500/10 transition duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl translate-y-8 -translate-x-8 pointer-events-none group-hover:bg-cyan-500/10 transition duration-500" />
        </div>
    );
}

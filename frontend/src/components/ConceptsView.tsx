import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, BookOpen, User, Zap, GraduationCap, Layers } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard utils

type ConceptCategory = 'TERM' | 'THEORY' | 'PERSON' | 'SKILL';

interface SavedConcept {
    id: string;
    term: string;
    category: ConceptCategory;
    definition: string;
    created_at: string;
}

const CATEGORIES: { id: ConceptCategory | 'ALL', label: string, icon: any, color: string }[] = [
    { id: 'ALL', label: 'Všechno', icon: Layers, color: 'text-slate-400' },
    { id: 'TERM', label: 'Pojmy', icon: BookOpen, color: 'text-cyan-400' },
    { id: 'THEORY', label: 'Teorie', icon: Zap, color: 'text-purple-400' },
    { id: 'PERSON', label: 'Osobnosti', icon: User, color: 'text-amber-400' },
    { id: 'SKILL', label: 'Dovednosti', icon: GraduationCap, color: 'text-emerald-400' },
];

export function ConceptsView() {
    const [concepts, setConcepts] = useState<SavedConcept[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<ConceptCategory | 'ALL'>('ALL');

    useEffect(() => {
        async function fetchConcepts() {
            setIsLoading(true);
            // Fetch from saved_concepts
            const { data, error } = await supabase
                .from('saved_concepts')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setConcepts(data as any);
            }
            if (error) {
                console.error("Error fetching concepts:", error);
            }
            setIsLoading(false);
        }
        fetchConcepts();
    }, []);

    const filtered = concepts.filter(c => {
        const matchesSearch = c.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.definition || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || c.category === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 w-full">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 mb-2">
                        Znalostní Báze
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Sbírka tvých osvojených znalostí ({concepts.length})
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Hledat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 transition"
                    />
                </div>
            </header>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border",
                                isActive
                                    ? "bg-slate-800 border-slate-600 text-white shadow-lg shadow-violet-500/10"
                                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? cat.color : "opacity-50")} />
                            {cat.label}
                            {/* Counter per category */}
                            {cat.id !== 'ALL' && (
                                <span className="opacity-40 text-[10px] ml-1">
                                    {concepts.filter(c => c.category === cat.id).length}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
                    {filtered.map(concept => {
                        const catDef = CATEGORIES.find(c => c.id === concept.category) || CATEGORIES[1];
                        const Icon = catDef.icon;

                        return (
                            <div key={concept.id} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl hover:border-slate-700 hover:bg-slate-900/60 transition group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-2 rounded-lg bg-slate-950 border border-slate-800", catDef.color)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{catDef.label}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-white mb-2 transition">
                                    {concept.term}
                                </h3>

                                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                                    {concept.definition}
                                </p>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-4">
                                <Layers className="w-8 h-8 text-slate-700" />
                            </div>
                            <p className="text-slate-500 font-medium">Zatím žádné záznamy v této kategorii.</p>
                            <p className="text-slate-600 text-sm mt-1">Dokonči lekci na mistrovské úrovni pro uložení konceptů.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

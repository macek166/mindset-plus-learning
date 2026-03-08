"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import { Microscope, Loader2, BookOpen, Sigma, History, GitBranch, Layers } from 'lucide-react';
import { deepenNode, getConcepts } from '@/lib/api';
import { KnowledgeTuner } from './KnowledgeTuner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Concept {
    id: string;
    term: string;
    definition: string;
    category: 'TERM' | 'THEORY' | 'PERSON' | 'SKILL';
}

interface StudyViewProps {
    nodeId?: string;
    title: string;
    content: string;
    citations?: string[];
    feedback?: { score: number; text: string; passed: boolean };
    onContentUpdate?: () => void;
}

export function StudyView({ nodeId, title, content, citations, feedback, onContentUpdate }: StudyViewProps) {
    const [isDeepening, setIsDeepening] = useState<string | null>(null);
    const [lessonConcepts, setLessonConcepts] = useState<Concept[]>([]);
    const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
    const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);

    useEffect(() => {
        // Fetch lesson concepts (specific to this node)
        if (nodeId) {
            const fetchLessonConcepts = async () => {
                setIsLoadingConcepts(true);
                try {
                    const data = await getConcepts(nodeId);
                    setLessonConcepts(data);
                } catch (e) {
                    console.error("Failed to load lesson concepts", e);
                } finally {
                    setIsLoadingConcepts(false);
                }
            };
            fetchLessonConcepts();
        } else {
            setLessonConcepts([]);
        }

        // Fetch ALL concepts (for highlighting in text)
        // We do this once or when nodeId changes (to refresh just in case)
        const fetchAllConcepts = async () => {
            try {
                const data = await getConcepts();
                setAllConcepts(data);
            } catch (e) {
                console.error("Failed to load all concepts", e);
            }
        };
        fetchAllConcepts();
    }, [nodeId]);

    // Helper to highlight terms in text
    const HighlightText = ({ text }: { text: string }) => {
        if (!text || !allConcepts.length) return <>{text}</>;

        // Create a regex from concept terms (sort by length desc to match "Neural Network" before "Network")
        // Escape regex special chars
        const terms = allConcepts.map(c => c.term).filter(Boolean);
        if (!terms.length) return <>{text}</>;

        // Simple dedupe and sort
        const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);

        // Use a more robust regex that ensures boundaries
        const pattern = new RegExp(`\\b(${uniqueTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

        const parts = text.split(pattern);

        return (
            <>
                {parts.map((part, i) => {
                    // Check if this part matches a concept (case insensitive)
                    const concept = allConcepts.find(c => c.term.toLowerCase() === part.toLowerCase());

                    // Also check if it's just a separator (split includes capturing groups)
                    if (concept) {
                        return (
                            <TooltipProvider key={i} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className={cn(
                                            "font-semibold border-b-[1.5px] border-dashed cursor-help transition-all duration-200 inline-block leading-tight",
                                            concept.category === 'TERM' && "text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-200",
                                            concept.category === 'THEORY' && "text-violet-300 border-violet-500/50 hover:bg-violet-500/20 hover:text-violet-200",
                                            concept.category === 'PERSON' && "text-amber-300 border-amber-500/50 hover:bg-amber-500/20 hover:text-amber-200",
                                            concept.category === 'SKILL' && "text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/20 hover:text-cyan-200",
                                        )}>
                                            {part}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-950 border border-slate-800 text-slate-200 max-w-sm p-4 shadow-2xl animate-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                concept.category === 'TERM' && "bg-emerald-950/50 text-emerald-400",
                                                concept.category === 'THEORY' && "bg-violet-950/50 text-violet-400",
                                                concept.category === 'PERSON' && "bg-amber-950/50 text-amber-400",
                                                concept.category === 'SKILL' && "bg-cyan-950/50 text-cyan-400",
                                            )}>
                                                {concept.category}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-300">
                                            {concept.definition}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </>
        );
    };

    // LaTeX cleanup
    const processedContent = content
        .replace(/\\\[/g, '$$$$')
        .replace(/\\\]/g, '$$$$')
        .replace(/\\\(/g, '$$')
        .replace(/\\\)/g, '$$');

    const handleDeepen = async (mode: 'GENERAL' | 'TECHNICAL' | 'CONTEXT' | 'CONCEPTS') => {
        if (!nodeId) return;
        setIsDeepening(mode);
        try {
            await deepenNode(nodeId, mode);
            if (onContentUpdate) onContentUpdate();
        } catch (e) {
            console.error(e);
            alert("Chyba při prohlubování obsahu.");
        } finally {
            setIsDeepening(null);
        }
    };

    const handleTune = async (tuning: Record<string, { depth: number, breadth: number }>) => {
        if (!nodeId) return;
        setIsDeepening('TUNING');
        try {
            await deepenNode(nodeId, 'TUNING', tuning);
            if (onContentUpdate) onContentUpdate();
        } catch (e) {
            console.error(e);
            alert("Chyba při ladění obsahu.");
        } finally {
            setIsDeepening(null);
        }
    };

    const DeepenButton = ({
        mode,
        icon: Icon,
        label,
        description,
        main = false
    }: {
        mode: 'GENERAL' | 'TECHNICAL' | 'CONTEXT' | 'CONCEPTS',
        icon: React.ElementType,
        label: string,
        description?: string,
        main?: boolean
    }) => {
        const isLoading = isDeepening === mode;
        const isDisabled = isDeepening !== null;

        return (
            <button
                onClick={() => handleDeepen(mode)}
                disabled={isDisabled}
                className={cn(
                    "flex items-center justify-center gap-2 transition-all font-bold shadow-lg border relative overflow-hidden group",
                    main
                        ? "px-6 py-3 rounded-full text-base w-full md:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-transparent hover:shadow-violet-500/25 hover:-translate-y-0.5"
                        : "px-3 py-1.5 rounded-lg text-xs w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-violet-500/50",
                    isDisabled && !isLoading && "opacity-50 cursor-not-allowed grayscale",
                    isLoading && "cursor-wait opacity-100"
                )}
                title={description}
            >
                {isLoading ? <Loader2 className={cn("animate-spin", main ? "w-5 h-5" : "w-3 h-3")} /> : <Icon className={cn(main ? "w-5 h-5" : "w-3 h-3")} />}
                <span>{isLoading ? "Generuji..." : label}</span>
                {main && <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all opacity-0 group-hover:opacity-100" />}
            </button>
        );
    };

    const renderWithHighlights = (nodes: React.ReactNode): React.ReactNode => {
        return React.Children.map(nodes, (child) => {
            if (typeof child === 'string') {
                return <HighlightText text={child} />;
            }
            if (React.isValidElement(child) && (child.type === 'strong' || child.type === 'em')) {
                const element = child as React.ReactElement<{ children?: React.ReactNode }>;
                return React.cloneElement(element, {}, renderWithHighlights(element.props.children));
            }
            return child;
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start relative animate-in fade-in duration-500 w-full min-w-0">

            {/* LEFT COLUMN: KNOWLEDGE TUNER (Sticky) */}
            {nodeId && (
                <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-8 order-2 lg:order-1 self-start z-10 space-y-6">
                    <KnowledgeTuner onTune={handleTune} isLoading={isDeepening !== null} />

                    {/* CONCEPTS WIDGET (Minimal) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-slate-950/50 p-3 border-b border-slate-800 flex justify-between items-center">
                            <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-violet-400" />
                                Koncepty lekce
                            </h4>
                            <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{lessonConcepts.length}</span>
                        </div>

                        {isLoadingConcepts ? (
                            <div className="p-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
                        ) : lessonConcepts.length > 0 ? (
                            <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                {lessonConcepts.map(c => (
                                    <div key={c.id} className="p-3 hover:bg-slate-800/30 transition group cursor-help relative">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold text-cyan-400">{c.term}</span>
                                            <span className="text-[10px] uppercase text-slate-600 font-mono tracking-tighter">{c.category}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug line-clamp-2 group-hover:line-clamp-none transition-all">
                                            {c.definition}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                                Zatím žádné uložené koncepty.<br />
                                <span className="opacity-50">Automaticky se uloží po zvládnutí lekce.</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 text-xs text-slate-500 hidden lg:block">
                        <h4 className="font-bold text-slate-400 mb-2">Jak používat Tuner?</h4>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Vyber nahoře <strong>Kanál</strong> (např. Technický Text).</li>
                            <li>Použij <strong>Šipky</strong> pro ladění parametrů.</li>
                            <li>Změny se aplikují <strong>ihned</strong> na text.</li>
                            <li>Tlačítko <strong>⤢</strong> (vpravo nahoře na grafu) přidá maximální boost.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* RIGHT COLUMN: CONTENT */}
            <article className="flex-1 min-w-0 order-1 lg:order-2 w-full">

                {feedback && (
                    <div className={cn(
                        "mb-8 p-6 rounded-xl border border-l-4 shadow-lg animate-in slide-in-from-top-4",
                        feedback.passed ? "bg-green-950/20 border-green-500" : "bg-red-950/20 border-red-500"
                    )}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={cn("text-lg font-bold mt-0", feedback.passed ? "text-green-400" : "text-red-400")}>
                                {feedback.passed ? "🎉 Gratuluji! Lekce splněna." : "⚠️ Doučování (Score: " + feedback.score + "%)"}
                            </h3>
                        </div>
                        <div className="text-slate-300 font-medium leading-relaxed">
                            {feedback.passed ? (
                                <div className="space-y-2">
                                    <p className="font-bold text-lg text-white">Dostáváš se o kus dál k cíli.</p>
                                    <p>Tato lekce je nyní hotová a otevřel se ti další bod v mapě. K tomuto tématu se vrátíme, až nastane čas pro opakování.</p>
                                    <div className="mt-4 pt-4 border-t border-green-500/30 text-sm opacity-80">
                                        <p>{feedback.text}</p>
                                    </div>
                                </div>
                            ) : (
                                <p>{feedback.text}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 my-0 max-w-2xl text-left">
                        {title}
                    </h1>

                    {nodeId && (
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            {/* Main Action */}
                            <DeepenButton
                                mode="GENERAL"
                                icon={Microscope}
                                label="Prohloubit"
                                description="Komplexně rozšířit a prohloubit toto téma"
                                main={true}
                            />

                            {/* Quick Actions (Legacy Presets) */}
                            <div className="flex flex-wrap justify-end gap-2 opacity-80 hover:opacity-100 transition-opacity">
                                <DeepenButton mode="TECHNICAL" icon={Sigma} label="Technika" />
                                <DeepenButton mode="CONTEXT" icon={History} label="Kontext" />
                                <DeepenButton mode="CONCEPTS" icon={GitBranch} label="Koncepty" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-slate-300 leading-relaxed max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            h1: ({ node: _node, ...props }) => <h1 className="text-3xl font-bold text-cyan-50 mt-12 mb-6 pb-2 border-b border-slate-800" {...props} />,
                            h2: ({ node: _node, ...props }) => <h2 className="text-2xl font-bold text-violet-400 mt-10 mb-4 flex items-center gap-2" {...props} />,
                            h3: ({ node: _node, ...props }) => <h3 className="text-xl font-semibold text-cyan-400 mt-8 mb-3" {...props} />,
                            h4: ({ node: _node, ...props }) => <h4 className="text-lg font-semibold text-white mt-6 mb-2" {...props} />,
                            p: ({ node: _node, children, ...props }) => <p className="mb-6 text-lg leading-8 text-slate-300 antialiased" {...props}>{renderWithHighlights(children)}</p>,
                            ul: ({ node: _node, ...props }) => <ul className="list-none pl-0 mb-6 space-y-3" {...props} />,
                            ol: ({ node: _node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-slate-300 marker:text-violet-500 marker:font-bold" {...props} />,
                            li: ({ node: _node, children, ...props }) => (
                                <li className="flex gap-3 text-slate-300 text-lg leading-7 pl-2 relative" {...props}>
                                    <span className="flex-1">{renderWithHighlights(children)}</span>
                                </li>
                            ),
                            blockquote: ({ node: _node, children, ...props }) => <blockquote className="border-l-4 border-violet-500 pl-6 py-3 my-8 bg-slate-900/50 rounded-r-lg italic text-slate-400 text-lg" {...props}>{renderWithHighlights(children)}</blockquote>,
                            img: ({ node: _node, ...props }: any) => <img className="rounded-xl border border-slate-800 my-8 shadow-md" alt="Ilustrace" {...props} />,
                            code: ({ node: _node, inline, className, children, ...props }: any) => {
                                return inline ? (
                                    <code className="bg-slate-800 text-cyan-300 rounded px-1.5 py-0.5 text-sm font-mono border border-slate-700" {...props}>{children}</code>
                                ) : (
                                    <div className="my-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                                        <pre className="p-6 overflow-x-auto">
                                            <code className="text-sm font-mono text-slate-300 leading-relaxed" {...props}>{children}</code>
                                        </pre>
                                    </div>
                                )
                            },
                            table: ({ node: _node, ...props }) => <div className="overflow-x-auto my-8 rounded-xl border border-slate-800 shadow-md"><table className="w-full text-left border-collapse bg-slate-900/40" {...props} /></div>,
                            thead: ({ node: _node, ...props }) => <thead className="bg-slate-900 text-slate-200" {...props} />,
                            th: ({ node: _node, ...props }) => <th className="p-4 font-bold text-sm uppercase tracking-wider border-b border-slate-800 text-violet-400" {...props} />,
                            td: ({ node: _node, ...props }) => <td className="p-4 border-b border-slate-800/50 text-slate-300 text-base" {...props} />,
                            strong: ({ node: _node, ...props }) => <strong className="font-bold text-cyan-300" {...props} />,
                            em: ({ node: _node, ...props }) => <em className="italic text-violet-300" {...props} />,
                            a: ({ node: _node, ...props }) => <a className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" {...props} />,
                            hr: ({ node: _node, ...props }) => <hr className="border-t border-slate-800 my-10" {...props} />,
                        }}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>

                {citations && citations.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Zdroje
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {citations.map((cite, i) => (
                                <li key={i}>
                                    <a href={cite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-900 transition-all text-sm text-slate-400 hover:text-cyan-400 group">
                                        <span className="flex-shrink-0 w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:text-cyan-400">{i + 1}</span>
                                        <span className="truncate">{cite}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </article>
        </div>
    );
}

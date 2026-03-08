"use client";

import React, { useState } from 'react';

interface TestViewProps {
    nodeTitle: string;
    onSubmit: (answer: string) => void;
    isSubmitting: boolean;
    feedback?: {
        passed: boolean;
        score: number;
        feedback: string;
        missedKpis?: string[];
    };
}

export function TestView({ nodeTitle, onSubmit, isSubmitting, feedback }: TestViewProps) {
    const [answer, setAnswer] = useState("");

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onSubmit(answer);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl border">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Active Recall: {nodeTitle}</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Explain the core concepts in your own words. Focus on the "why" and "how".
                </p>
            </div>

            {!feedback ? (
                <div className="space-y-4">
                    <textarea
                        className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800 leading-relaxed"
                        placeholder="Start typing your explanation here..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={isSubmitting}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !answer.trim()}
                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Evaluating..." : "Submit Answer"}
                    </button>
                </div>
            ) : (
                <div className={`p-6 rounded-lg border ${feedback.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-2xl font-bold ${feedback.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {feedback.passed ? "Gratuluji, prošel jsi. Dostáváš se o kus dál k cíli." : "Je potřeba ještě zabrat"}
                        </span>
                        <span className="text-xl font-bold text-gray-700">
                            Skóre: {feedback.score}/100
                        </span>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-800">
                        <p>{feedback.feedback}</p>
                    </div>

                    {feedback.missedKpis && feedback.missedKpis.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Chybějící koncepty:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                {feedback.missedKpis.map((kpi, i) => (
                                    <li key={i}>{kpi}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 text-sm text-indigo-600 hover:underline"
                    >
                        Zpět k učení
                    </button>
                </div>
            )}
        </div>
    );
}

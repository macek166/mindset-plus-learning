"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { evaluateAttempt } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Timeline } from '@/components/Timeline';
import { ConceptsView } from '@/components/ConceptsView';
import { StudyView } from '@/components/StudyView';
import { TestView } from '@/components/TestView';
import { DashboardProjects } from '@/components/DashboardProjects';
import { Node } from '@/types';
import { Loader2, Zap, ArrowLeft, LayoutDashboard, Menu, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'LEARNING' | 'CONCEPTS' | 'SETTINGS'>('LEARNING');

  // Navigation State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Project View State
  const [mode, setMode] = useState<'TIMELINE' | 'STUDY' | 'TEST'>('TIMELINE');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test & Remediation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null); // For TestView feedback
  const [studyFeedback, setStudyFeedback] = useState<any>(null); // For StudyView header (remedial context)
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null); // For auto-switching after fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Nodes Logic
  useEffect(() => {
    async function fetchGraph() {
      if (!selectedGoalId) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('goal_id', selectedGoalId)
        .order('created_at', { ascending: true }); // Important order for tree build

      if (data) {
        const loadedNodes = data as unknown as Node[];
        setNodes(loadedNodes);

        // Auto-switch logic
        if (pendingNodeId) {
          const target = loadedNodes.find(n => n.id === pendingNodeId);
          if (target) {
            setSelectedNode(target);
            setMode('STUDY');
            setPendingNodeId(null);
          }
        }

        // Live Content Update logic (if we are looking at a node that just got updated)
        if (selectedNode) {
          const updated = loadedNodes.find(n => n.id === selectedNode.id);
          if (updated) setSelectedNode(updated);
        }
      }
      setIsLoading(false);
    }
    fetchGraph();
  }, [selectedGoalId, refreshTrigger, pendingNodeId]); // Intentionally omitting selectedNode to avoid loops

  const handleNodeClick = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setMode('STUDY');
      setStudyFeedback(null); // Clear momentarily
      setTestResult(null);

      // Fetch latest feedback to restore context
      let { data: attempt } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no attempt on this node, check parent for context (remedial chain)
      let isInherited = false;
      if (!attempt && node.parent_node_id) {
        const { data: parentAttempt } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('node_id', node.parent_node_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (parentAttempt && !parentAttempt.passed) {
          attempt = parentAttempt;
          isInherited = true;
        }
      }

      if (attempt && attempt.ai_feedback) {
        setStudyFeedback({
          passed: attempt.passed,
          score: attempt.score,
          text: (isInherited ? "🔍 KONTEXT DOUČOVÁNÍ (Z předchozí chyby): " : "") + attempt.ai_feedback.feedback
        });
      }
    }
  };

  const handleStartTest = () => {
    setTestResult(null);
    setMode('TEST');
  };

  const handleEvaluate = async (essay: string) => {
    if (!selectedNode) return;
    setIsSubmitting(true);
    try {
      const result = await evaluateAttempt(selectedNode.id, essay);

      const feedbackData = {
        passed: result.status === 'passed',
        score: result.score,
        text: result.feedback
      };

      setTestResult({
        ...feedbackData,
        missedKpis: result.missed_kpis,
        nextAction: result.next_action
      });

      // Remediation / Next Step Logic
      if (result.remedial_node_id) {
        // Store feedback to show on the NEW node
        setStudyFeedback(feedbackData);
        setPendingNodeId(result.remedial_node_id);
        setTestResult(null); // Clear test result so we don't show it confusingly
        setRefreshTrigger(prev => prev + 1); // Trigger fetch -> auto-switch
      } else if (result.status === 'passed') {
        // If passed, unlock next nodes
        setStudyFeedback(feedbackData);
        setRefreshTrigger(prev => prev + 1);
      }

    } catch (e) {
      console.error("Evaluation error:", e);
      alert("Chyba při odesílání testu. Zkontrolujte připojení.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-violet-500/30">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'LEARNING') {
          setSelectedGoalId(null);
        }
      }} />

      <main className="flex-1 ml-64 p-8 overflow-y-auto w-full">

        {/* LEARNING TAB */}
        {activeTab === 'LEARNING' && (
          <>
            {/* DASHBOARD */}
            {!selectedGoalId && (
              <DashboardProjects
                onSelectProject={(id) => {
                  setSelectedGoalId(id);
                  setMode('TIMELINE');
                  setPendingNodeId(null);
                }}
                onGoalCreated={(newGoalId) => {
                  setSelectedGoalId(newGoalId);
                  setMode('TIMELINE');
                  setPendingNodeId(null);
                  setRefreshTrigger(prev => prev + 1);
                }}
                onNavigateToNode={(goalId, nodeId) => {
                  setSelectedGoalId(goalId);
                  setPendingNodeId(nodeId);
                  // mode will be set by useEffect once nodes are loaded
                }}
              />
            )}

            {/* PROJECT VIEW */}
            {selectedGoalId && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full relative">

                {/* Header Navigation (Sticky) */}
                <div className="flex items-center justify-between mb-0 sticky top-0 bg-slate-950/95 backdrop-blur z-50 py-4 border-b border-slate-900 shadow-md">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedGoalId(null)}
                      className="px-3 py-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium border border-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      DASHBOARD
                    </button>
                    <div className="h-6 w-px bg-slate-800" />
                    <h2 className="text-xl font-bold text-slate-200">
                      Studijní Plán
                    </h2>
                  </div>
                </div>

                {/* TIMELINE Always Visible (Sticky under header) */}
                <div className="mb-8 border-b border-slate-900 pt-10 pb-6 sticky top-[73px] bg-slate-950 z-40 shadow-xl transition-all">
                  {isLoading && !nodes.length ? (
                    <div className="flex justify-center h-24 items-center">
                      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                  ) : (
                    <Timeline
                      nodes={nodes}
                      onNodeClick={handleNodeClick}
                      selectedNodeId={selectedNode?.id}
                    />
                  )}
                </div>

                {/* CONTENT AREA (Study or Test) */}
                <div className="min-h-[500px] pt-4">
                  {mode === 'TIMELINE' && (
                    <div className="text-center py-20 text-slate-500 animate-pulse">
                      <p>Vyber lekci v ose nahoře pro zahájení studia.</p>
                    </div>
                  )}

                  {mode === 'STUDY' && selectedNode && (() => {
                    const nextReview = selectedNode.next_review_at ? new Date(selectedNode.next_review_at) : null;
                    const now = new Date();
                    const isLocked = nextReview && nextReview > now && (selectedNode.repetition_level || 0) > 0;

                    const formatTime = (date: Date) => {
                      const diff = date.getTime() - now.getTime();
                      if (diff <= 0) return "0m";
                      const hrs = Math.floor(diff / (1000 * 60 * 60));
                      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hrs}h ${mins}m`;
                    };

                    return (
                      <div className="w-full px-4 animate-in slide-in-from-bottom-4 duration-500 pb-20">

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
                          <StudyView
                            nodeId={selectedNode.id}
                            title={selectedNode.title}
                            content={selectedNode.content_md || "Generuji obsah..."}
                            citations={(selectedNode as any).citations || []}
                            feedback={studyFeedback}
                            onContentUpdate={() => setRefreshTrigger(prev => prev + 1)}
                          />

                          <div className="mt-16 pt-8 border-t border-slate-800 flex justify-center sticky bottom-8">
                            <button
                              onClick={handleStartTest}
                              disabled={isLocked || false}
                              className={cn(
                                "group relative inline-flex items-center justify-center px-8 py-4 text-white font-bold transition-all duration-200 font-lg rounded-full focus:outline-none ring-offset-2 shadow-2xl z-50",
                                isLocked
                                  ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                                  : "bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/40 focus:ring-2 ring-violet-500"
                              )}
                            >
                              {isLocked ? (
                                <span className="flex items-center gap-2 font-mono">
                                  <Lock className="w-4 h-4" />
                                  TEST ZAMČEN: {formatTime(nextReview!)}
                                </span>
                              ) : (
                                <>
                                  <span className="mr-2"><Zap className="w-5 h-5 fill-current" /></span>
                                  Spustit Test Znalostí
                                  <div className="absolute -inset-3 rounded-full border border-violet-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition duration-500"></div>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {mode === 'TEST' && selectedNode && (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
                      <button
                        onClick={() => setMode('STUDY')}
                        className="text-sm text-slate-500 hover:text-cyan-400 mb-6 flex items-center gap-2 transition"
                      >
                        <ArrowLeft className="w-4 h-4" /> Zpět na studium
                      </button>
                      <TestView
                        nodeTitle={selectedNode.title}
                        isSubmitting={isSubmitting}
                        onSubmit={handleEvaluate}
                        feedback={testResult}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* CONCEPTS TAB */}
        {activeTab === 'CONCEPTS' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <ConceptsView />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">
            <h2 className="text-2xl font-bold text-slate-300 mb-4">Nastavení</h2>
            <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <p>Verze: 2.3.2 (Deepen + LaTeX)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

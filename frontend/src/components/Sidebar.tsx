import React from 'react';
import { BookOpen, Lightbulb, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    activeTab: 'LEARNING' | 'CONCEPTS' | 'SETTINGS';
    onTabChange: (tab: 'LEARNING' | 'CONCEPTS' | 'SETTINGS') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const navItems = [
        { id: 'LEARNING', label: 'Tvé Učení', icon: BookOpen },
        { id: 'CONCEPTS', label: 'Koncepty', icon: Lightbulb },
        { id: 'SETTINGS', label: 'Nastavení', icon: Settings },
    ] as const;

    return (
        <div className="h-screen w-64 bg-slate-950 border-r border-slate-900 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-6">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                    MindLoop
                </h1>
                <p className="text-xs text-slate-500 font-mono tracking-widest mt-1">2.0 ALPHA</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2 mt-8">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-violet-600/10 text-violet-400 border border-violet-900/50"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Hook */}
            <div className="p-4 border-t border-slate-900">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-200">Demo User</p>
                        <p className="text-xs text-slate-500">Free Plan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createGoal } from '@/lib/api';
import { Loader2, Plus, Target } from 'lucide-react';

interface CreateGoalDialogProps {
    onGoalCreated: (goalId: string) => void;
}

export function CreateGoalDialog({ onGoalCreated }: CreateGoalDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"SKILL" | "KNOWLEDGE">("SKILL");
    const [level, setLevel] = useState<"BASIC" | "ADVANCED" | "EXPERT">("ADVANCED");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await createGoal(title, description, type, level);
            setOpen(false);
            setTitle("");
            setDescription("");
            onGoalCreated(result.goal_id);
        } catch (error) {
            console.error(error);
            alert("Vytvoření cíle selhalo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold shadow-lg border-0">
                    <Plus className="w-4 h-4" />
                    Nový Cíl
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                        Vytvořit Vzdělávací Cíl
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Definuj, co se chceš naučit. AI pro tebe vytvoří strukturovanou cestu.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    {/* Goal Title */}
                    <div className="grid gap-2">
                        <Label htmlFor="title" className="text-slate-300">Cíl (Téma)</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="např. DNA a evoluční biologie"
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600"
                            required
                        />
                    </div>

                    {/* Levels and Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-slate-300">Typ</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="SKILL">Dovednost (Praxe)</SelectItem>
                                    <SelectItem value="KNOWLEDGE">Znalost (Teorie)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-300">Úroveň</Label>
                            <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="BASIC">Základní (Wiki)</SelectItem>
                                    <SelectItem value="ADVANCED">Pokročilá</SelectItem>
                                    <SelectItem value="EXPERT">Expert (Akademická)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Context */}
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-slate-300">Kontext a Motivace</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Chci se naučit..."
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Generuji Plán..." : "Vytvořit Plán"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

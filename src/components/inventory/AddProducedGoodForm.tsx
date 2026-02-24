"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";

type RawMaterial = {
    id: number;
    name: string;
    sku: string;
};

export function AddProducedGoodForm() {
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [recipe, setRecipe] = useState<Record<string, number>>({});
    const [selectedRawSku, setSelectedRawSku] = useState("");
    const [selectedRawQty, setSelectedRawQty] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const supabase = createSupabaseClient();
        const fetchMaterials = async () => {
            const { data } = await supabase.from("raw_materials").select("id, name, sku").order("name");
            if (data) {
                setMaterials(data as RawMaterial[]);
                if (data.length > 0) setSelectedRawSku(data[0].sku);
            }
        };
        fetchMaterials();
    }, []);

    const handleAddRecipeItem = () => {
        if (!selectedRawSku || selectedRawQty <= 0) return;
        setRecipe((prev) => ({
            ...prev,
            [selectedRawSku]: (prev[selectedRawSku] || 0) + selectedRawQty,
        }));
    };

    const handleRemoveRecipeItem = (skuToRemove: string) => {
        setRecipe((prev) => {
            const newRecipe = { ...prev };
            delete newRecipe[skuToRemove];
            return newRecipe;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !sku || Object.keys(recipe).length === 0) {
            alert("Please provide a name, sku, and at least one item in the recipe.");
            return;
        }

        setSubmitting(true);
        const supabase = createSupabaseClient();

        const { error } = await supabase.from("produced_goods").insert({
            name,
            sku,
            quantity: 0,
            recipe,
        });

        setSubmitting(false);

        if (error) {
            alert(error.message);
        } else {
            setName("");
            setSku("");
            setRecipe({});
        }
    };

    return (
        <section className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
            <h2 className="text-sm font-semibold text-blue-950">
                Create New Product & Recipe
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-sm">
                        <label className="block text-slate-400">Product Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
                            placeholder="e.g. Dining Table"
                        />
                    </div>
                    <div className="space-y-1 text-sm">
                        <label className="block text-slate-400">SKU</label>
                        <input
                            type="text"
                            required
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
                            placeholder="e.g. TABLE-001"
                        />
                    </div>
                </div>

                <div className="rounded-md border border-blue-200 bg-white/90 backdrop-blur-md shadow-xl p-3">
                    <h3 className="mb-2 text-xs font-semibold text-slate-700">Recipe (Bill of Materials)</h3>

                    <div className="mb-3 flex items-end gap-2 text-sm">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-slate-400">Raw Material</label>
                            <select
                                value={selectedRawSku}
                                onChange={(e) => setSelectedRawSku(e.target.value)}
                                className="w-full rounded-md border border-blue-200 bg-slate-50 px-2 py-1.5 outline-none focus:border-sky-500"
                            >
                                {materials.map((m) => (
                                    <option key={m.sku} value={m.sku}>
                                        {m.name} ({m.sku})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24 space-y-1">
                            <label className="text-xs text-slate-400">Qty</label>
                            <input
                                type="number"
                                min={1}
                                value={selectedRawQty}
                                onChange={(e) => setSelectedRawQty(Number(e.target.value))}
                                className="w-full rounded-md border border-blue-200 bg-slate-50 px-2 py-1.5 outline-none focus:border-sky-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddRecipeItem}
                            className="rounded-md bg-slate-700 px-3 py-1.5 font-medium text-blue-950 transition hover:bg-slate-600"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries(recipe).map(([rawSku, rQty]) => (
                            <span
                                key={rawSku}
                                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-950"
                            >
                                {rQty}× {rawSku}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRecipeItem(rawSku)}
                                    className="rounded-full bg-slate-700 p-0.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </span>
                        ))}
                        {Object.keys(recipe).length === 0 && (
                            <span className="text-xs text-slate-400">No materials added yet.</span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                    {submitting ? "Saving..." : "Save Product"}
                </button>
            </form>
        </section>
    );
}

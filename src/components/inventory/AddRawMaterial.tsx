"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";

export function AddRawMaterialForm() {
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [colorCode, setColorCode] = useState("#000000");
    const [unit, setUnit] = useState("pcs");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !sku || !unit) return;
        setSubmitting(true);

        const supabase = createSupabaseClient();
        const { error } = await supabase.from("raw_materials").insert({
            name,
            sku,
            quantity,
            color_code: colorCode,
            unit,
        });

        setSubmitting(false);

        if (error) {
            alert(error.message);
        } else {
            setName("");
            setSku("");
            setQuantity(0);
            setColorCode("#000000");
            setUnit("pcs");
        }
    };

    return (
        <section className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
            <h2 className="text-sm font-semibold text-blue-950">
                Add New Raw Material
            </h2>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                        placeholder="e.g. Oak Wood"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">SKU</label>
                    <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                        placeholder="e.g. OAK-W-01"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Initial Quantity</label>
                    <input
                        type="number"
                        min={0}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Unit</label>
                    <input
                        type="text"
                        required
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                        placeholder="e.g. kg, pcs"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Color Code (Hex)</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={colorCode}
                            onChange={(e) => setColorCode(e.target.value)}
                            className="h-9 w-12 rounded-md border border-blue-200 bg-blue-50 p-0 text-slate-800 outline-none focus:border-sky-500"
                        />
                        <input
                            type="text"
                            required
                            value={colorCode}
                            onChange={(e) => setColorCode(e.target.value)}
                            className="flex-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600 sm:w-auto"
                    >
                        {submitting ? "Adding..." : "Save Material"}
                    </button>
                </div>
            </form>
        </section>
    );
}

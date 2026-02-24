"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";

type ProducedGood = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    recipe: Record<string, number>;
};

export function ProduceGoodsForm() {
    const [goods, setGoods] = useState<ProducedGood[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [qty, setQty] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const supabase = createSupabaseClient();
        const fetchGoods = async () => {
            try {
                const { data, error } = await supabase
                    .from("produced_goods")
                    .select("id, name, sku, quantity, recipe")
                    .order("name");
                if (data) setGoods(data as ProducedGood[]);
            } catch (e) {
                console.warn("Error fetching produced_goods", e);
            }
        };
        fetchGoods();
    }, []);

    const handleProduce = async () => {
        if (!selectedId || qty <= 0) return;
        setSubmitting(true);
        const supabase = createSupabaseClient();

        const { error } = await supabase.rpc("produce_goods_from_raw", {
            p_good_id: selectedId,
            p_units: qty,
        });

        setSubmitting(false);

        if (error) {
            alert(error.message);
        } else {
            setQty(1);
            alert("Successfully produced goods!");
        }
    };

    return (
        <section className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
            <h2 className="text-sm font-semibold text-blue-950">
                Manufacture Goods
            </h2>
            <p className="text-xs text-slate-400">
                Run production to convert raw materials into finished goods based on their recipes.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Select Item to Produce</label>
                    <select
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                        value={selectedId || ""}
                        onChange={(e) => setSelectedId(Number(e.target.value))}
                    >
                        <option value="" disabled>Select a produced good...</option>
                        {goods.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.sku})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Quantity to Produce</label>
                    <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleProduce}
                        disabled={!selectedId || submitting}
                        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600 sm:w-auto"
                    >
                        {submitting ? "Producing..." : "Run Production"}
                    </button>
                </div>
            </div>
        </section>
    );
}

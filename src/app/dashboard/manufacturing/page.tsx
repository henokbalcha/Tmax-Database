"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import {
  ManufacturingTransferForm,
  TransferRequestsList,
  ProducedGoodsTransferForm
} from "@/components/transfer/TransferRequests";
import { ProduceGoodsForm } from "@/components/inventory/ProduceGoodsForm";
import { AddProducedGoodForm } from "@/components/inventory/AddProducedGoodForm";

type ProducedGood = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  recipe: Record<string, number>;
};

export default function ManufacturingDashboard() {
  const [goods, setGoods] = useState<ProducedGood[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const fetchGoods = async () => {
      try {
        const { data, error } = await supabase
          .from("produced_goods")
          .select("*")
          .order("name");
        if (error) {
          console.warn("Failed to load produced_goods, using placeholders", error);
          return;
        }
        if (data) {
          setGoods(data as ProducedGood[]);
        }
      } catch (e) {
        console.warn("Error fetching produced_goods, using placeholders", e);
      }
    };

    fetchGoods();

    const channel = supabase
      .channel("produced_goods_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "produced_goods" },
        () => fetchGoods()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manufacturing
        </h1>
        <p className="text-sm text-slate-700">
          Convert raw materials into finished goods using production recipes.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1.5fr,2fr]">
        <AddProducedGoodForm />
        <ProduceGoodsForm />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ManufacturingTransferForm fromDept="PROCUREMENT" toDept="MANUFACTURING" />
          <TransferRequestsList
            role="MANUFACTURING"
            fromDept="PROCUREMENT"
            toDept="MANUFACTURING"
          />
        </div>
        <div className="space-y-6">
          <ProducedGoodsTransferForm
            fromDept="MANUFACTURING"
            toDept="DISTRIBUTION"
            title="Transfer to Warehouse"
            helperText="Create a PENDING transfer of finished goods to Distribution."
          />
          <TransferRequestsList
            role="MANUFACTURING"
            fromDept="MANUFACTURING"
            toDept="DISTRIBUTION"
          />
        </div>
      </div>

      <section className="rounded-xl border border-blue-100 bg-white shadow-sm p-4">
        <h2 className="mb-3 text-sm font-semibold text-blue-950">
          Produced Goods & Recipes
        </h2>
        <div className="overflow-hidden rounded-lg border border-blue-100">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  SKU
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Quantity
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">
                  Recipe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-white">
              {goods.map((g) => (
                <tr key={g.id}>
                  <td className="px-3 py-2">{g.name}</td>
                  <td className="px-3 py-2 text-slate-700">{g.sku}</td>
                  <td className="px-3 py-2">{g.quantity}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">
                    {Object.entries(g.recipe).map(([rawSku, qty]) => (
                      <span
                        key={rawSku}
                        className="mr-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5"
                      >
                        {qty}× {rawSku}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
              {goods.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-slate-400"
                    colSpan={4}
                  >
                    No produced goods yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


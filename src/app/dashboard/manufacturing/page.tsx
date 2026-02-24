"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { ManufacturingTransferForm, TransferRequestsList, ProducedGoodsTransferForm } from "@/components/transfer/TransferRequests";
import { ProduceGoodsForm } from "@/components/inventory/ProduceGoodsForm";
import { AddProducedGoodForm } from "@/components/inventory/AddProducedGoodForm";
import { ExportButton } from "@/components/ui/ExportButton";

type ProducedGood = { id: number; name: string; sku: string; quantity: number; recipe: Record<string, number> };

export default function ManufacturingDashboard() {
  const [goods, setGoods] = useState<ProducedGood[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const fetch = async () => {
      const { data } = await supabase.from("produced_goods").select("*").order("name");
      if (data) setGoods(data as ProducedGood[]);
    };
    fetch();
    const ch = supabase.channel("pg_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "produced_goods" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const exportData = goods.map(({ id: _id, recipe, ...rest }) => ({
    ...rest,
    recipe: Object.entries(recipe).map(([k, v]) => `${v}× ${k}`).join(", "),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Manufacturing</h1>
        <p className="text-sm text-slate-500 mt-0.5">Convert raw materials into finished goods using production recipes.</p>
      </header>

      {/* Define new product */}
      <div className="card">
        <AddProducedGoodForm />
      </div>

      {/* Run production */}
      <div className="card">
        <ProduceGoodsForm />
      </div>

      {/* Request raw materials */}
      <ManufacturingTransferForm fromDept="PROCUREMENT" toDept="MANUFACTURING" />

      {/* Incoming raw material requests */}
      <TransferRequestsList role="MANUFACTURING" fromDept="PROCUREMENT" toDept="MANUFACTURING" />

      {/* Send finished goods to Distribution */}
      <ProducedGoodsTransferForm
        fromDept="MANUFACTURING" toDept="DISTRIBUTION"
        title="Transfer Finished Goods to Warehouse"
        helperText="Create a PENDING transfer of finished goods to the Distribution warehouse."
      />

      {/* Outgoing to Distribution */}
      <TransferRequestsList role="MANUFACTURING" fromDept="MANUFACTURING" toDept="DISTRIBUTION" />

      {/* Produced Goods Catalogue */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Produced Goods &amp; Recipes</h2>
          <ExportButton data={exportData} filename="produced_goods" sheetName="Produced Goods" />
        </div>
        <div className="table-wrap">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Qty in Stock</th>
                <th>Recipe</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium text-slate-800">{g.name}</td>
                  <td className="font-mono text-slate-500">{g.sku}</td>
                  <td className="text-slate-700">{g.quantity}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(g.recipe).map(([rawSku, qty]) => (
                        <span key={rawSku} className="inline-flex rounded-full bg-[#e1f5fe] px-2 py-0.5 text-[11px] font-medium text-[#0288d1]">
                          {qty}× {rawSku}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {goods.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">No produced goods defined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

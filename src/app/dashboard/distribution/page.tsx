"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { TransferRequestsList } from "@/components/transfer/TransferRequests";
import { ExportButton } from "@/components/ui/ExportButton";

type ProducedGood = { id: number; name: string; sku: string; quantity: number };

export default function DistributionDashboard() {
  const [goods, setGoods] = useState<ProducedGood[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const fetch = async () => {
      const { data } = await supabase.from("produced_goods").select("*").order("name");
      if (data) setGoods(data as ProducedGood[]);
    };
    fetch();
    const ch = supabase.channel("dist_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "produced_goods" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const exportData = goods.map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Distribution (Warehouse)</h1>
        <p className="text-sm text-slate-500 mt-0.5">Central storage for finished goods — approve incoming and outgoing transfers.</p>
      </header>

      {/* Incoming from Manufacturing */}
      <TransferRequestsList role="DISTRIBUTION" fromDept="MANUFACTURING" toDept="DISTRIBUTION" />

      {/* Outgoing to Retail */}
      <TransferRequestsList role="DISTRIBUTION" fromDept="DISTRIBUTION" toDept="RETAIL" />

      {/* Warehouse Stock */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Warehouse Stock</h2>
          <ExportButton data={exportData} filename="warehouse_stock" sheetName="Warehouse" />
        </div>
        <div className="table-wrap">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Qty Available</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium text-slate-800">{g.name}</td>
                  <td className="font-mono text-slate-500">{g.sku}</td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${g.quantity > 10 ? "bg-emerald-100 text-emerald-700" :
                        g.quantity > 0 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-600"
                      }`}>
                      {g.quantity}
                    </span>
                  </td>
                </tr>
              ))}
              {goods.length === 0 && (
                <tr><td colSpan={3} className="py-10 text-center text-sm text-slate-400">No warehouse stock yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

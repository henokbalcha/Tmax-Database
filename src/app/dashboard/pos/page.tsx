"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { ExportButton } from "@/components/ui/ExportButton";
import { ShoppingBag } from "lucide-react";

type ProducedGood = { id: number; name: string; sku: string; quantity: number };

export default function PosDashboard() {
  const [goods, setGoods] = useState<ProducedGood[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "CREDIT">("PAID");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const fetch = async () => {
      const { data } = await supabase.from("produced_goods").select("*").order("name");
      if (data) setGoods(data as ProducedGood[]);
    };
    fetch();
    const ch = supabase.channel("pos_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "produced_goods" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSale = async () => {
    if (!selectedId || qty <= 0) return;
    setSubmitting(true);
    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("record_sale_and_decrement_stock", {
      p_item_id: selectedId,
      p_quantity: qty,
      p_payment_status: paymentStatus,
    });
    setSubmitting(false);
    if (error) { alert(error.message); } else { setQty(1); }
  };

  const selected = goods.find((g) => g.id === selectedId);
  const exportData = goods.map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Point of Sale</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record customer sales — stock is automatically decremented from Retail inventory.</p>
      </header>

      {/* Available items table */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Available Items</h2>
          <ExportButton data={exportData} filename="pos_inventory" sheetName="POS Items" />
        </div>
        <div className="table-wrap">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>In Stock</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((g) => (
                <tr key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`cursor-pointer transition-colors ${selectedId === g.id ? "bg-[#e1f5fe]" : ""}`}
                >
                  <td className="font-medium text-slate-800">{g.name}</td>
                  <td className="font-mono text-slate-500">{g.sku}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${g.quantity > 10 ? "bg-emerald-100 text-emerald-700" :
                        g.quantity > 0 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-600"
                      }`}>
                      {g.quantity}
                    </span>
                  </td>
                  <td>
                    <div className={`h-4 w-4 rounded-full border-2 ${selectedId === g.id ? "border-[#29b6f6] bg-[#29b6f6]" : "border-slate-300"}`} />
                  </td>
                </tr>
              ))}
              {goods.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-slate-400">No items available. Transfer stock from Retail first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Form */}
      <div className="card max-w-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#29b6f6]" />
          <h2 className="text-base font-semibold text-slate-800">New Sale</h2>
        </div>
        {selected && (
          <div className="mb-4 rounded-lg bg-[#e1f5fe] px-4 py-3 text-sm">
            <span className="font-semibold text-[#0288d1]">{selected.name}</span>
            <span className="ml-2 font-mono text-slate-500">{selected.sku}</span>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Quantity to Sell</label>
            <input type="number" min={1} value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="form-input" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Payment Method</label>
            <select value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "CREDIT")}
              className="form-input">
              <option value="PAID">💳 Paid</option>
              <option value="CREDIT">📋 Credit</option>
            </select>
          </div>
          <button type="button" onClick={handleSale}
            disabled={!selectedId || submitting}
            className="btn-approve w-full disabled:opacity-50">
            {submitting ? "Recording…" : "Record Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

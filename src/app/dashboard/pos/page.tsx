"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";

type ProducedGood = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
};

export default function PosDashboard() {
  const [goods, setGoods] = useState<ProducedGood[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "CREDIT">("PAID");

  useEffect(() => {
    const supabase = createSupabaseClient();

    const fetchGoods = async () => {
      try {
        const { data, error } = await supabase
          .from("produced_goods")
          .select("*")
          .order("name");
        if (error) {
          console.warn("Failed to load produced_goods for POS, using placeholders", error);
          return;
        }
        if (data) {
          setGoods(data as ProducedGood[]);
        }
      } catch (e) {
        console.warn("Error fetching produced_goods for POS, using placeholders", e);
      }
    };

    fetchGoods();

    const channel = supabase
      .channel("pos_goods_changes")
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

  const handleSale = async () => {
    if (!selectedId || qty <= 0) return;
    const supabase = createSupabaseClient();

    const { error } = await supabase.rpc("record_sale_and_decrement_stock", {
      p_item_id: selectedId,
      p_quantity: qty,
      p_payment_status: paymentStatus,
    });

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
    } else {
      setQty(1);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Point of Sale
        </h1>
        <p className="text-sm text-slate-700">
          Record sales and automatically decrement retail inventory.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr,1.3fr]">
        <div className="rounded-xl border border-blue-100 bg-white shadow-sm p-4">
          <h2 className="mb-3 text-sm font-semibold text-blue-950">
            Available Items
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
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-white">
                {goods.map((g) => (
                  <tr
                    key={g.id}
                    className={
                      selectedId === g.id
                        ? "bg-blue-100/50"
                        : "cursor-pointer hover:bg-blue-50/50"
                    }
                    onClick={() => setSelectedId(g.id)}
                  >
                    <td className="px-3 py-2">{g.name}</td>
                    <td className="px-3 py-2 text-slate-700">{g.sku}</td>
                    <td className="px-3 py-2">{g.quantity}</td>
                  </tr>
                ))}
                {goods.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-sm text-slate-400"
                      colSpan={3}
                    >
                      No items available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold text-blue-950">New Sale</h2>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block text-slate-700">Quantity</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
                className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "PAID" | "CREDIT")
                }
                className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-sky-500"
              >
                <option value="PAID">Paid</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleSale}
              disabled={!selectedId}
              className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              Record Sale
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


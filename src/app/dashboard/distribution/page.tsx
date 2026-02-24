"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import {
  ProducedGoodsTransferForm,
  TransferRequestsList,
} from "@/components/transfer/TransferRequests";

type ProducedGood = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
};

export default function DistributionDashboard() {
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
          console.warn("Failed to load produced_goods for warehouse, using placeholders", error);
          return;
        }
        if (data) {
          setGoods(data as ProducedGood[]);
        }
      } catch (e) {
        console.warn("Error fetching produced_goods for warehouse, using placeholders", e);
      }
    };

    fetchGoods();

    const channel = supabase
      .channel("distribution_goods_changes")
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
          Distribution (Warehouse)
        </h1>
        <p className="text-sm text-slate-700">
          Central storage for finished goods and approval of incoming/outgoing
          transfers.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <TransferRequestsList
            role="DISTRIBUTION"
            fromDept="MANUFACTURING"
            toDept="DISTRIBUTION"
          />
        </div>
        <div className="space-y-6">
          <TransferRequestsList
            role="DISTRIBUTION"
            fromDept="DISTRIBUTION"
            toDept="RETAIL"
          />
        </div>
      </div>

      <section className="rounded-xl border border-blue-100 bg-white shadow-sm p-4">
        <h2 className="mb-3 text-sm font-semibold text-blue-950">
          Warehouse Stock
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-white">
              {goods.map((g) => (
                <tr key={g.id}>
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
                    No warehouse stock yet.
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


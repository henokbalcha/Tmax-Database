"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { TransferRequestsList } from "@/components/transfer/TransferRequests";
import { AddRawMaterialForm } from "@/components/inventory/AddRawMaterial";

type RawMaterial = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  color_code: string;
  unit: string;
};

export default function ProcurementDashboard() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from("raw_materials")
          .select("*")
          .order("name");
        if (error) {
          console.warn("Failed to load raw_materials, using placeholders", error);
          return;
        }
        if (data) {
          setMaterials(data as RawMaterial[]);
        }
      } catch (e) {
        console.warn("Error fetching raw_materials, using placeholders", e);
      }
    };

    fetchMaterials();

    const channel = supabase
      .channel("raw_materials_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "raw_materials" },
        () => fetchMaterials()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Procurement</h1>
        <p className="text-sm text-slate-700">
          Manage incoming raw materials and respond to manufacturing requests.
        </p>
      </header>

      <AddRawMaterialForm />

      <section className="rounded-xl border border-blue-100 bg-white shadow-sm p-4">
        <h2 className="mb-3 text-sm font-semibold text-blue-950">
          Raw Materials
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
                  Color
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-white">
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2 text-slate-700">{m.sku}</td>
                  <td className="px-3 py-2">
                    {m.quantity}{" "}
                    <span className="text-xs text-slate-400">{m.unit}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-slate-900"
                      style={{ backgroundColor: m.color_code }}
                    >
                      {m.color_code}
                    </span>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-sm text-slate-400"
                    colSpan={4}
                  >
                    No raw materials yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TransferRequestsList
        role="PROCUREMENT"
        fromDept="PROCUREMENT"
        toDept="MANUFACTURING"
      />
    </div>
  );
}


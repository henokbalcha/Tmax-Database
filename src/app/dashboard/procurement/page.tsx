"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { AddRawMaterialForm } from "@/components/inventory/AddRawMaterial";
import { TransferRequestsList } from "@/components/transfer/TransferRequests";
import { ExportButton } from "@/components/ui/ExportButton";
import { ImportExcelButton } from "@/components/ui/ImportExcelButton";

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
      const { data } = await supabase.from("raw_materials").select("*").order("name");
      if (data) setMaterials(data as RawMaterial[]);
    };
    fetchMaterials();
    const ch = supabase.channel("rm_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "raw_materials" }, fetchMaterials)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const exportData = materials.map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Procurement</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage raw material stock and approve manufacturing requests.</p>
      </header>

      {/* Add Material Form Card */}
      <div className="card">
        <AddRawMaterialForm />
      </div>

      {/* Raw Materials Table Card */}
      <div className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Raw Materials Inventory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Import a spreadsheet or export current stock to Excel.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImportExcelButton />
            <ExportButton data={exportData} filename="raw_materials" sheetName="Raw Materials" />
          </div>
        </div>
        <div className="table-wrap">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-slate-800">{m.name}</td>
                  <td className="font-mono text-slate-500">{m.sku}</td>
                  <td className="text-slate-700">{m.quantity}</td>
                  <td className="text-slate-500">{m.unit}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-slate-200 shadow-sm"
                        style={{ background: m.color_code }}
                      />
                      <span className="font-mono text-xs text-slate-400">{m.color_code}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No raw materials yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Requests */}
      <TransferRequestsList role="PROCUREMENT" fromDept="PROCUREMENT" toDept="MANUFACTURING" />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { ExportButton } from "@/components/ui/ExportButton";

export type TransferStatus = "PENDING" | "ADJUSTED" | "APPROVED";

export type TransferItem = {
  item_type: "RAW" | "PRODUCED";
  item_id: number;
  sku: string;
  requested_qty: number;
  approved_qty?: number | null;
};

export type TransferRequest = {
  id: number;
  from_dept: "PROCUREMENT" | "MANUFACTURING" | "DISTRIBUTION" | "RETAIL" | "POS";
  to_dept: "PROCUREMENT" | "MANUFACTURING" | "DISTRIBUTION" | "RETAIL" | "POS";
  items: TransferItem[];
  status: TransferStatus;
  created_at: string;
};

type ManufacturingFormProps = {
  fromDept: TransferRequest["from_dept"];
  toDept: TransferRequest["to_dept"];
};

type RoleContext =
  | "PROCUREMENT"
  | "MANUFACTURING"
  | "DISTRIBUTION"
  | "RETAIL"
  | "POS";

type RequestsListProps = {
  role: RoleContext;
  fromDept: TransferRequest["from_dept"];
  toDept: TransferRequest["to_dept"];
};

type RawMaterial = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
};

type ProducedGood = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
};

export function ManufacturingTransferForm({ fromDept, toDept }: ManufacturingFormProps) {
  const [materials, setMaterials] = useState<RawMaterial[]>([
    {
      id: 1,
      name: "Chair Leg",
      sku: "LEG-001",
      quantity: 400,
      unit: "pcs",
    },
    {
      id: 2,
      name: "Chair Seat",
      sku: "SEAT-001",
      quantity: 100,
      unit: "pcs",
    },
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from("raw_materials")
          .select("id, name, sku, quantity, unit")
          .order("name");
        if (error) {
          console.warn("Failed to load raw_materials for transfers, using placeholders", error);
          return;
        }
        if (data) {
          setMaterials(data as RawMaterial[]);
        }
      } catch (e) {
        console.warn("Error fetching raw_materials for transfers, using placeholders", e);
      }
    };
    fetchMaterials();
  }, []);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedId) ?? null,
    [materials, selectedId]
  );

  const handleSubmit = async () => {
    if (!selectedMaterial || qty <= 0) return;
    setSubmitting(true);

    const supabase = createSupabaseClient();
    const items: TransferItem[] = [
      {
        item_type: "RAW",
        item_id: selectedMaterial.id,
        sku: selectedMaterial.sku,
        requested_qty: qty,
        approved_qty: null,
      },
    ];

    const { error } = await supabase.from("transfer_requests").insert({
      from_dept: fromDept,
      to_dept: toDept,
      items,
      status: "PENDING",
    });

    setSubmitting(false);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
      return;
    }

    setQty(10);
  };

  return (
    <section className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
      <h2 className="text-sm font-semibold text-slate-800">
        Request Raw Materials from Procurement
      </h2>
      <p className="text-xs text-slate-400">
        Manufacturing creates a PENDING request that Procurement can adjust or approve.
      </p>
      <div className="grid gap-4 text-sm md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500">Raw Material</label>
          <div className="table-wrap max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-blue-100 text-xs">
              <thead className="sticky top-0 bg-blue-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">SKU</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
                {materials.map((m) => (
                  <tr
                    key={m.id}
                    className={selectedId === m.id ? "bg-blue-100" : "cursor-pointer hover:bg-blue-50 transition-colors"}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <td className="px-4 py-2 text-slate-800">{m.name}</td>
                    <td className="px-4 py-2 text-slate-500 font-mono">{m.sku}</td>
                    <td className="px-4 py-2 text-slate-800">{m.quantity} <span className="text-[10px] text-slate-400">{m.unit}</span></td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-xs text-slate-400" colSpan={3}>No raw materials defined.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Requested Quantity</label>
            <input
              type="number" min={1} value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button type="button" onClick={handleSubmit} disabled={!selectedMaterial || submitting}
            className="btn-approve w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {submitting ? "Submitting…" : "Create Request"}
          </button>
        </div>
      </div>
    </section>
  );
}

type ProducedFormProps = {
  fromDept: TransferRequest["from_dept"];
  toDept: TransferRequest["to_dept"];
  title: string;
  helperText: string;
};

export function ProducedGoodsTransferForm({
  fromDept,
  toDept,
  title,
  helperText,
}: ProducedFormProps) {
  const [goods, setGoods] = useState<ProducedGood[]>([
    {
      id: 1,
      name: "Dining Chair",
      sku: "CHAIR-001",
      quantity: 25,
    },
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const fetchGoods = async () => {
      try {
        const { data, error } = await supabase
          .from("produced_goods")
          .select("id, name, sku, quantity")
          .order("name");
        if (error) {
          console.warn("Failed to load produced_goods for transfers, using placeholders", error);
          return;
        }
        if (data) {
          setGoods((data ?? []) as ProducedGood[]);
        }
      } catch (e) {
        console.warn("Error fetching produced_goods for transfers, using placeholders", e);
      }
    };
    fetchGoods();
  }, []);

  const selectedGood = useMemo(
    () => goods.find((g) => g.id === selectedId) ?? null,
    [goods, selectedId]
  );

  const handleSubmit = async () => {
    if (!selectedGood || qty <= 0) return;
    setSubmitting(true);

    const supabase = createSupabaseClient();
    const items: TransferItem[] = [
      {
        item_type: "PRODUCED",
        item_id: selectedGood.id,
        sku: selectedGood.sku,
        requested_qty: qty,
        approved_qty: null,
      },
    ];

    const { error } = await supabase.from("transfer_requests").insert({
      from_dept: fromDept,
      to_dept: toDept,
      items,
      status: "PENDING",
    });

    setSubmitting(false);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
      return;
    }

    setQty(10);
  };

  return (
    <section className="space-y-4 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-400">{helperText}</p>
      <div className="grid gap-4 text-sm md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-500">Produced Good</label>
          <div className="table-wrap max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-blue-100 text-xs">
              <thead className="sticky top-0 bg-blue-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">SKU</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
                {goods.map((g) => (
                  <tr
                    key={g.id}
                    className={selectedId === g.id ? "bg-blue-100" : "cursor-pointer hover:bg-blue-50 transition-colors"}
                    onClick={() => setSelectedId(g.id)}
                  >
                    <td className="px-4 py-2 text-slate-800">{g.name}</td>
                    <td className="px-4 py-2 text-slate-500 font-mono">{g.sku}</td>
                    <td className="px-4 py-2 text-slate-800">{g.quantity}</td>
                  </tr>
                ))}
                {goods.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-xs text-slate-400" colSpan={3}>No produced goods defined.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Requested Quantity</label>
            <input type="number" min={1} value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button type="button" onClick={handleSubmit} disabled={!selectedGood || submitting}
            className="btn-approve w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {submitting ? "Submitting…" : "Create Request"}
          </button>
        </div>
      </div>
    </section>
  );
}
export function TransferRequestsList({
  role,
  fromDept,
  toDept,
}: RequestsListProps) {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("from_dept", fromDept)
          .eq("to_dept", toDept)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Failed to load transfer_requests, list will be empty", error);
          return;
        }

        setRequests((data ?? []) as TransferRequest[]);
      } catch (e) {
        console.warn("Error fetching transfer_requests, list will be empty", e);
      }
    };

    fetchRequests();

    const channel = supabase
      .channel("transfer_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transfer_requests" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fromDept, toDept]);

  const canEdit = role === fromDept;

  const handleAdjust = async (r: TransferRequest, newApprovedQty: number) => {
    if (!canEdit || newApprovedQty < 0) return;
    setUpdatingId(r.id);
    const supabase = createSupabaseClient();
    const items = r.items.map((item) => ({
      ...item,
      approved_qty: newApprovedQty,
    }));
    const { error } = await supabase
      .from("transfer_requests")
      .update({
        status: "ADJUSTED",
        items,
      })
      .eq("id", r.id);
    setUpdatingId(null);
    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
    }
  };

  const handleApprove = async (r: TransferRequest) => {
    if (!canEdit) return;
    setUpdatingId(r.id);
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("transfer_requests")
      .update({
        status: "APPROVED",
        items: r.items,
      })
      .eq("id", r.id);
    setUpdatingId(null);
    if (error) {
      // eslint-disable-next-line no-alert
      alert(error.message);
    }
  };

  const exportData = requests.map((r) => ({
    created: new Date(r.created_at).toLocaleString(),
    from: r.from_dept,
    to: r.to_dept,
    sku: r.items[0]?.sku ?? "",
    requested_qty: r.items[0]?.requested_qty ?? "",
    approved_qty: r.items[0]?.approved_qty ?? "",
    status: r.status,
  }));

  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Transfers:{" "}
            <span className="text-[#29b6f6]">{fromDept}</span>
            {" → "}
            <span className="text-[#29b6f6]">{toDept}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === "MANUFACTURING" ? "Read-only view of request status." : "Adjust quantities and approve when ready."}
          </p>
        </div>
        <ExportButton
          data={exportData}
          filename={`transfers_${fromDept}_to_${toDept}`}
          sheetName="Transfers"
        />
      </div>

      <div className="table-wrap">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Created</th>
              <th>Item (SKU)</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Status</th>
              {canEdit && <th style={{ textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const firstItem = r.items[0];
              return (
                <tr key={r.id}>
                  <td className="text-slate-400 whitespace-nowrap text-xs">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="font-mono text-slate-700 whitespace-nowrap">{firstItem?.sku ?? "–"}</td>
                  <td className="text-slate-700">{firstItem?.requested_qty ?? "–"}</td>
                  <td className="text-slate-700">{firstItem?.approved_qty ?? "–"}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                        r.status === "ADJUSTED" ? "bg-[#e1f5fe] text-[#0288d1]" :
                          "bg-emerald-100 text-emerald-700"
                      }`}>
                      {r.status}
                    </span>
                  </td>
                  {canEdit && firstItem && (
                    <td>
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={updatingId === r.id}
                          onClick={() => {
                            const input = window.prompt("Approved quantity:", String(firstItem.approved_qty ?? firstItem.requested_qty));
                            if (input == null) return;
                            const next = Number(input);
                            if (Number.isNaN(next) || next < 0) return;
                            handleAdjust(r, next);
                          }}
                          className="btn-adjust">
                          Adjust
                        </button>
                        <button type="button" disabled={updatingId === r.id}
                          onClick={() => handleApprove(r)}
                          className="btn-approve">
                          {updatingId === r.id ? "…" : "Approve ✓"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td className="py-10 text-center text-sm text-slate-400" colSpan={canEdit ? 6 : 5}>
                  No transfer requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


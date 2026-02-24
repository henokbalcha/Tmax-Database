"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";

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
      <h2 className="text-sm font-semibold text-blue-950">
        Request Raw Materials from Procurement
      </h2>
      <p className="text-xs text-slate-400">
        Manufacturing creates a PENDING request that Procurement can adjust or approve.
      </p>
      <div className="grid gap-3 text-sm md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-2">
          <label className="block text-slate-700">Raw Material</label>
          <div className="overflow-hidden rounded-lg border border-blue-100 max-h-60">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
                    Name
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
                    SKU
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-white">
                {materials.map((m) => (
                  <tr
                    key={m.id}
                    className={
                      selectedId === m.id
                        ? "bg-blue-100/50"
                        : "cursor-pointer hover:bg-blue-50/50"
                    }
                    onClick={() => setSelectedId(m.id)}
                  >
                    <td className="px-2 py-1">{m.name}</td>
                    <td className="px-2 py-1 text-slate-700">{m.sku}</td>
                    <td className="px-2 py-1">
                      {m.quantity}{" "}
                      <span className="text-[10px] text-slate-400">{m.unit}</span>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs text-slate-400"
                      colSpan={3}
                    >
                      No raw materials defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-slate-700">Requested Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedMaterial || submitting}
            className="inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {submitting ? "Submitting..." : "Create Request"}
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
      <h2 className="text-sm font-semibold text-blue-950">{title}</h2>
      <p className="text-xs text-slate-400">{helperText}</p>
      <div className="grid gap-3 text-sm md:grid-cols-[2fr,1.3fr]">
        <div className="space-y-2">
          <label className="block text-slate-700">Produced Good</label>
          <div className="overflow-hidden rounded-lg border border-blue-100 max-h-60">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
                    Name
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
                    SKU
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-slate-700">
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
                    <td className="px-2 py-1">{g.name}</td>
                    <td className="px-2 py-1 text-slate-700">{g.sku}</td>
                    <td className="px-2 py-1">{g.quantity}</td>
                  </tr>
                ))}
                {goods.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-xs text-slate-400"
                      colSpan={3}
                    >
                      No produced goods defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-slate-700">Requested Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedGood || submitting}
            className="inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {submitting ? "Submitting..." : "Create Request"}
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

  return (
    <section className="space-y-3 rounded-xl border border-blue-100 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-blue-950">
          Transfer Requests ({fromDept} → {toDept})
        </h2>
        <span className="text-xs text-slate-400">
          {role === "MANUFACTURING"
            ? "Read-only view of request status."
            : "Adjust quantities and approve when ready."}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-blue-100">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-slate-700">
                Created
              </th>
              <th className="px-2 py-1 text-left font-medium text-slate-700">
                Item (SKU)
              </th>
              <th className="px-2 py-1 text-left font-medium text-slate-700">
                Requested
              </th>
              <th className="px-2 py-1 text-left font-medium text-slate-700">
                Approved
              </th>
              <th className="px-2 py-1 text-left font-medium text-slate-700">
                Status
              </th>
              {canEdit && (
                <th className="px-2 py-1 text-right font-medium text-slate-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-white">
            {requests.map((r) => {
              const firstItem = r.items[0];

              return (
                <tr key={r.id}>
                  <td className="px-2 py-1 text-slate-400">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-1">
                    {firstItem?.sku ?? "-"}
                  </td>
                  <td className="px-2 py-1">
                    {firstItem?.requested_qty ?? "-"}
                  </td>
                  <td className="px-2 py-1">
                    {firstItem?.approved_qty ?? "-"}
                  </td>
                  <td className="px-2 py-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-800"
                          : r.status === "ADJUSTED"
                          ? "bg-sky-500/15 text-blue-800"
                          : "bg-emerald-500/15 text-emerald-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  {canEdit && firstItem && (
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={updatingId === r.id}
                          onClick={() => {
                            // eslint-disable-next-line no-alert
                            const input = window.prompt(
                              "Approved quantity:",
                              String(firstItem.approved_qty ?? firstItem.requested_qty)
                            );
                            if (input == null) return;
                            const next = Number(input);
                            if (Number.isNaN(next) || next < 0) return;
                            handleAdjust(r, next);
                          }}
                          className="rounded-md bg-white border border-blue-200 px-3 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 ease-in-out rounded-lg"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === r.id}
                          onClick={() => handleApprove(r)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 ease-in-out rounded-lg"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-xs text-slate-400"
                  colSpan={canEdit ? 6 : 5}
                >
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


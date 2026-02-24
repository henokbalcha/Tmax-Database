"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { FileUp, Loader2, X, Download } from "lucide-react";

type RawMaterialRow = {
    name: string;
    sku: string;
    quantity: number;
    unit: string;
    color_code: string;
};

type Status = "idle" | "parsing" | "importing" | "success" | "error";

/** Download a blank template so users know the required columns */
function downloadTemplate() {
    const template = [{ name: "Example Fabric", sku: "FAB-001", quantity: 100, unit: "m", color_code: "#ffffff" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Raw Materials");
    XLSX.writeFile(wb, "raw_materials_template.xlsx");
}

export function ImportExcelButton({ onSuccess }: { onSuccess?: () => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [preview, setPreview] = useState<RawMaterialRow[]>([]);
    const [skipped, setSkipped] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);

    /* ── Parse uploaded file ── */
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (inputRef.current) inputRef.current.value = "";

        setStatus("parsing");
        setMessage("");

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

            const parsed: RawMaterialRow[] = [];
            const errors: string[] = [];

            rows.forEach((row, idx) => {
                // Accept both lowercase and title-case column names
                const name = String(row.name ?? row.Name ?? "").trim();
                const sku = String(row.sku ?? row.SKU ?? row.Sku ?? "").trim();
                const qty = Number(row.quantity ?? row.Quantity ?? row.Qty ?? row.qty ?? 0);
                const unit = String(row.unit ?? row.Unit ?? "pcs").trim();
                const color = String(row.color_code ?? row["Color Code"] ?? row.color ?? row.Color ?? "#000000").trim();

                if (!name || !sku) {
                    errors.push(`Row ${idx + 2}: missing name or SKU — skipped.`);
                    return;
                }
                parsed.push({ name, sku, quantity: isNaN(qty) ? 0 : qty, unit, color_code: color });
            });

            if (parsed.length === 0) {
                setStatus("error");
                setMessage("No valid rows found. Check the template for required columns.");
                return;
            }

            setPreview(parsed);
            setSkipped(errors);
            setShowModal(true);
            setStatus("idle");
        } catch {
            setStatus("error");
            setMessage("Could not parse file. Please upload a valid .xlsx or .csv file.");
        }
    };

    /* ── Upsert rows into Supabase ── */
    const handleImport = async () => {
        setStatus("importing");
        const supabase = createSupabaseClient();

        const { error } = await supabase
            .from("raw_materials")
            .upsert(preview, { onConflict: "sku" });   // update existing SKUs, insert new ones

        if (error) {
            setStatus("error");
            setMessage(`Import failed: ${error.message}`);
        } else {
            setStatus("success");
            setMessage(`✓ ${preview.length} row(s) imported successfully.`);
            setShowModal(false);
            setPreview([]);
            onSuccess?.();
        }
    };

    const handleCancel = () => {
        setPreview([]);
        setSkipped([]);
        setShowModal(false);
        setStatus("idle");
        setMessage("");
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
            />

            {/* Button group */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Download template */}
                <button
                    type="button"
                    onClick={downloadTemplate}
                    title="Download blank Excel template"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-700 hover:-translate-y-0.5"
                >
                    <Download className="h-3.5 w-3.5" />
                    Template
                </button>

                {/* Import trigger */}
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={status === "parsing" || status === "importing"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#29b6f6]/40 bg-[#e1f5fe] px-3 py-1.5 text-xs font-semibold text-[#0288d1] shadow-sm transition-all duration-200 hover:bg-[#29b6f6] hover:text-white hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === "parsing" ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Parsing…</>
                    ) : (
                        <><FileUp className="h-3.5 w-3.5" />Import Excel</>
                    )}
                </button>
            </div>

            {/* Inline status */}
            {message && (
                <p className={`mt-2 text-xs ${status === "error" ? "text-red-500" :
                        status === "success" ? "text-emerald-600" : "text-amber-600"
                    }`}>
                    {message}
                </p>
            )}

            {/* ── Preview Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#b3e5fc] flex flex-col max-h-[90vh]">
                        {/* Modal header */}
                        <div className="flex items-center justify-between border-b border-[#e1f5fe] px-6 py-4 flex-shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Preview Import</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {preview.length} row(s) ready to import.
                                    {skipped.length > 0 && (
                                        <span className="ml-2 text-amber-500">{skipped.length} row(s) skipped (missing name/SKU).</span>
                                    )}
                                </p>
                            </div>
                            <button onClick={handleCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Info banner */}
                        <div className="mx-6 mt-4 flex-shrink-0 rounded-lg bg-[#e1f5fe] px-4 py-2.5 text-xs text-[#0288d1]">
                            <strong>Note:</strong> Existing rows with the same SKU will be <strong>updated</strong>. New SKUs will be <strong>inserted</strong>.
                        </div>

                        {/* Table preview */}
                        <div className="overflow-auto flex-1 p-4 mt-2">
                            <div className="table-wrap">
                                <table className="min-w-full">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>SKU</th>
                                            <th>Qty</th>
                                            <th>Unit</th>
                                            <th>Color</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i}>
                                                <td className="text-slate-400">{i + 1}</td>
                                                <td className="font-medium text-slate-800">{row.name}</td>
                                                <td className="font-mono text-slate-500">{row.sku}</td>
                                                <td className="text-slate-700">{row.quantity}</td>
                                                <td className="text-slate-500">{row.unit}</td>
                                                <td>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span
                                                            className="h-4 w-4 rounded-full border border-slate-200 shadow-sm flex-shrink-0"
                                                            style={{ background: row.color_code }}
                                                        />
                                                        <span className="font-mono text-xs text-slate-400">{row.color_code}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Skipped rows warning */}
                            {skipped.length > 0 && (
                                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                                    <p className="text-xs font-semibold text-amber-700 mb-1">Skipped Rows:</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {skipped.map((s, i) => <li key={i} className="text-xs text-amber-600">{s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="flex justify-end gap-3 border-t border-[#e1f5fe] px-6 py-4 flex-shrink-0">
                            <button onClick={handleCancel} className="btn-adjust">Cancel</button>
                            <button
                                onClick={handleImport}
                                disabled={status === "importing"}
                                className="btn-approve disabled:opacity-50"
                            >
                                {status === "importing" ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />Importing…</>
                                ) : (
                                    `Import ${preview.length} Row${preview.length !== 1 ? "s" : ""}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

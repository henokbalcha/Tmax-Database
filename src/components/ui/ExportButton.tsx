"use client";

import { FileDown } from "lucide-react";
import { exportToExcel } from "@/lib/exportToExcel";

type Props = {
    data: Record<string, unknown>[];
    filename: string;
    sheetName?: string;
};

export function ExportButton({ data, filename, sheetName }: Props) {
    return (
        <button
            type="button"
            onClick={() => exportToExcel(data, filename, sheetName)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#29b6f6]/40 bg-[#e1f5fe] px-3 py-1.5 text-xs font-semibold text-[#0288d1] shadow-sm transition-all duration-200 hover:bg-[#29b6f6] hover:text-white hover:-translate-y-0.5 hover:shadow-md"
        >
            <FileDown className="h-3.5 w-3.5" />
            Export Excel
        </button>
    );
}

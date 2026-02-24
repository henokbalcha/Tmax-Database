import * as XLSX from "xlsx";

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * @param data  Array of plain objects (table rows)
 * @param filename  File name without extension
 * @param sheetName  Optional worksheet tab name
 */
export function exportToExcel(
    data: Record<string, unknown>[],
    filename: string,
    sheetName = "Sheet1"
) {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

const colorMap = {
    // Backgrounds
    "bg-slate-950/70": "bg-white/80 backdrop-blur-md", // Sidebar
    "bg-slate-950/60": "bg-white",
    "bg-slate-950": "bg-slate-50",
    "bg-slate-900/50": "bg-white/90 backdrop-blur-md shadow-xl", // Login box
    "bg-slate-900/40": "bg-white shadow-sm", // Dashboard cards
    "hover:bg-slate-900/60": "hover:bg-blue-50/50",
    "hover:bg-slate-900": "hover:bg-blue-50",
    "bg-slate-900": "bg-blue-50",
    "bg-slate-800/60": "bg-blue-100/50",
    "hover:bg-slate-800": "hover:bg-blue-100",
    "bg-slate-800": "bg-blue-100",
    // Borders
    "border-slate-800": "border-blue-100",
    "border-slate-700": "border-blue-200",
    // Text colors
    "text-slate-50": "text-slate-900", // Major headers / Main text (10% black part)
    "text-slate-100": "text-slate-800",
    "text-slate-200": "text-blue-950", // Soft headers
    "text-slate-300": "text-slate-700", // Labels
    "text-slate-400": "text-slate-500", // Muted
    "text-slate-500": "text-slate-400",
    // Status badges
    "text-amber-300": "text-amber-800",
    "text-sky-300": "text-blue-800",
    "text-emerald-300": "text-emerald-800",
};

// Approval Button updates specifically
const oldApproveClasses = "bg-emerald-500 px-2 py-1 text-[10px] font-medium text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed";
const newApproveClasses = "bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 ease-in-out rounded-lg";

const oldAdjustClasses = "bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed";
const newAdjustClasses = "bg-white border border-blue-200 px-3 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 ease-in-out rounded-lg";

const files = getAllFiles(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Specific Button replacements
    content = content.replace(oldApproveClasses, newApproveClasses);
    content = content.replace(oldAdjustClasses, newAdjustClasses);

    // Apply generic mappings
    Object.keys(colorMap).forEach(key => {
        const val = colorMap[key];
        // Use regex to replace exact class matches
        const regex = new RegExp(`(?<=[\\s"'\\\`])` + key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + `(?=[\\s"'\\\`])`, 'g');
        content = content.replace(regex, val);
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated: " + file);
    }
});

console.log('Conversion Complete.');

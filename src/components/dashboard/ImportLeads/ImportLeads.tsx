"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Trash2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { leadStatuses } from "@/types/lead";

interface CSVLead {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
}

interface PreviewLead extends CSVLead {
  rowNumber: number;
  valid: boolean;
  error: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
  invalidRows: number[];
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sampleCSV = [
  "name,email,phone,company,status,source",
  "John Doe,john@example.com,01712345678,Google,New,Website",
  "Sarah Khan,sarah@example.com,01812345678,Microsoft,Contacted,Referral",
  "Alex Smith,alex@example.com,01912345678,Amazon,Qualified,LinkedIn",
].join("\n");

export default function ImportLeads() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewLead[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows = rows.filter((row) => row.valid).length;
  const invalidRows = rows.length - validRows;

  const clearFile = () => {
    setFileName("");
    setRows([]);
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "leadflow-sample-leads.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const parseFile = (file?: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("CSV file must be smaller than 5MB.");
      return;
    }

    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) =>
        header.trim().replace(/^\uFEFF/, "").toLowerCase(),

      complete: ({ data, meta, errors }) => {
        if (errors.length > 0) {
          toast.error("CSV parsing failed. Check your file format.");
          return;
        }

        const required = ["name", "email", "status"];

        const missing = required.filter(
          (field) => !meta.fields?.includes(field)
        );

        if (missing.length > 0) {
          toast.error(
            `Missing required columns: ${missing.join(", ")}`
          );
          return;
        }

        if (data.length === 0) {
          toast.error("CSV file is empty.");
          return;
        }

        if (data.length > 1000) {
          toast.error("Maximum 1000 leads per import.");
          return;
        }

        const seen = new Set<string>();

        const parsed: PreviewLead[] = data.map((item, index) => {
          const name = String(item.name ?? "").trim();
          const email = String(item.email ?? "")
            .trim()
            .toLowerCase();
          const status = String(item.status ?? "").trim();

          const errors: string[] = [];

          if (!name) errors.push("Name required");

          if (!emailRegex.test(email)) {
            errors.push("Invalid email");
          }

          if (
            !leadStatuses.some((value) => value === status)
          ) {
            errors.push("Invalid status");
          }

          if (emailRegex.test(email) && seen.has(email)) {
            errors.push("Duplicate in CSV");
          }

          if (emailRegex.test(email)) {
            seen.add(email);
          }

          return {
            rowNumber: index + 2,
            name,
            email,
            phone: String(item.phone ?? "").trim(),
            company: String(item.company ?? "").trim(),
            status,
            source: String(item.source ?? "").trim() || "CSV Import",
            valid: errors.length === 0,
            error: errors.join(", "),
          };
        });

        setFileName(file.name);
        setRows(parsed);

        toast.success("CSV file parsed successfully!");
      },

      error: () => {
        toast.error("Unable to read CSV file.");
      },
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    parseFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleImport = async () => {
    if (validRows === 0 || importing) return;

    try {
      setImporting(true);

      // Send all rows so backend can report invalid and
      // duplicate rows in its final import summary.
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leads: rows.map((row) => ({
            name: row.name,
            email: row.email,
            phone: row.phone,
            company: row.company,
            status: row.status,
            source: row.source,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }

      setResult(data);

      toast.success(
        `${data.imported} leads imported successfully!`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import failed"
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Import Leads
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Upload a CSV file to import multiple leads into LeadFlow.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={downloadSample}
          className="gap-2"
        >
          <Download size={17} />
          Download Sample CSV
        </Button>
      </div>

      {/* Upload Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            parseFile(event.dataTransfer.files[0]);
          }}
          className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging
              ? "border-teal-500 bg-teal-50"
              : "border-slate-200 bg-slate-50/70"
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <UploadCloud size={30} className="text-teal-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-900">
            Drag and drop your CSV file here
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Or browse files from your device
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 bg-teal-600 hover:bg-teal-700"
          >
            Choose CSV File
          </Button>

          <p className="mt-4 text-xs text-slate-400">
            CSV only · Maximum 5MB · Up to 1000 leads
          </p>
        </div>

        {fileName && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileSpreadsheet className="shrink-0 text-teal-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {fileName}
                </p>
                <p className="text-xs text-slate-500">
                  {rows.length} rows detected
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={importing}
            >
              <Trash2 size={18} className="text-red-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Validation Stats */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Total Rows",
                value: rows.length,
                icon: FileSpreadsheet,
                color: "text-slate-700",
                bg: "bg-slate-100",
              },
              {
                title: "Valid Rows",
                value: validRows,
                icon: CheckCircle2,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                title: "Invalid / Duplicate Rows",
                value: invalidRows,
                icon: AlertCircle,
                color: "text-red-600",
                bg: "bg-red-50",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className={`mb-4 w-fit rounded-xl p-3 ${item.bg}`}>
                    <Icon size={20} className={item.color} />
                  </div>

                  <p className="text-sm text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Preview Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  CSV Preview
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review your leads before importing
                </p>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || validRows === 0 || !!result}
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                {importing ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <ArrowRight size={17} />
                )}

                {importing ? "Importing..." : "Import Valid Leads"}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Row</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Validation</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((lead) => (
                    <tr
                      key={lead.rowNumber}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-4 text-slate-500">
                        {lead.rowNumber}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {lead.name || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {lead.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {lead.company || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {lead.status || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {lead.valid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={13} />
                            Valid
                          </span>
                        ) : (
                          <span
                            title={lead.error}
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            <AlertCircle size={13} />
                            {lead.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Import Summary */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600" />

            <div>
              <h3 className="text-lg font-bold text-emerald-900">
                Import Completed
              </h3>
              <p className="text-sm text-emerald-700">
                Your CSV file has been processed.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Total", result.total],
              ["Imported", result.imported],
              ["Duplicates", result.duplicates],
              ["Invalid", result.invalid],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-white p-4 text-center"
              >
                <p className="text-2xl font-bold text-slate-900">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
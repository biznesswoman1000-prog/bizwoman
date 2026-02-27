"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { apiGet, apiPost, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export function ImportExportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      // ✅ FIXED: Using export routes - /api/v1/export/products/csv
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/export/products/csv`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast("Products exported successfully", "success");
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      // ✅ FIXED: Using export routes - /api/v1/export/products/pdf
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/export/products/pdf`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast("Products exported successfully", "success");
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // ✅ FIXED: Using export routes - /api/v1/export/products/template
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/export/products/template`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-import-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast("Template downloaded", "success");
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", file);

      // ✅ FIXED: Using export routes - /api/v1/export/products/import
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/export/products/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }

      setImportResult(data.data);
      toast(data.message, "success");
      onSuccess();
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Import / Export Products
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "export"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "import"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Import
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Export all products to CSV or PDF format for backup or analysis.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleExportCSV}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Export as CSV</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Editable spreadsheet format
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleExportPDF}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-8 h-8 text-red-600" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Export as PDF</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Printable inventory report
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Importing will update existing
                  products (matched by SKU or slug) or create new ones. Download
                  the template to see the required format.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all text-sm font-medium text-gray-700"
              >
                <Download className="w-4 h-4" />
                Download CSV Template
              </button>

              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={isLoading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className={`flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Upload className="w-10 h-10 text-gray-400" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {isLoading ? "Importing..." : "Click to upload CSV file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </label>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">
                        {importResult.success} products imported successfully
                      </p>
                    </div>
                  </div>

                  {importResult.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">
                            {importResult.failed} products failed to import
                          </p>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {importResult.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          >
                            <p className="font-semibold text-gray-900">
                              Row {error.row}:
                            </p>
                            <p className="text-red-600 mt-1">{error.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

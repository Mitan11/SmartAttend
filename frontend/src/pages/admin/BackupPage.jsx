import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axios";
import {
  Database,
  Download,
  Upload,
  Trash2,
  HardDrive,
  RefreshCw,
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  Clock,
  FileArchive,
  ChevronDown,
  ChevronUp,
  Save,
  Loader,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Toast component ─────────────────────────────────────────────────────────

function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
            t.type === "success"
              ? "bg-emerald-500/90 text-white"
              : t.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-blue-600/90 text-white"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle size={16} />
          ) : t.type === "error" ? (
            <AlertTriangle size={16} />
          ) : (
            <Loader size={16} className="animate-spin" />
          )}
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-1 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            danger ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          <AlertTriangle size={28} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-gray-500 text-center text-sm mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all ${
              danger
                ? "bg-red-500 hover:bg-red-600 shadow-red-200 shadow-lg"
                : "bg-amber-500 hover:bg-amber-600 shadow-amber-200 shadow-lg"
            }`}
          >
            {danger ? "Delete" : "Restore"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Selector ──────────────────────────────────────────────────────

function CollectionSelector({ collections, selected, onChange, label }) {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === 0;

  const toggle = (col) => {
    if (selected.includes(col)) {
      onChange(selected.filter((c) => c !== col));
    } else {
      onChange([...selected, col]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-indigo-400 transition-all font-medium shadow-sm"
      >
        <Database size={15} className="text-indigo-500" />
        {allSelected
          ? "All Collections"
          : `${selected.length} collection${selected.length > 1 ? "s" : ""} selected`}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-30 min-w-56">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors ${
              allSelected ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ✦ All Collections
          </button>
          <div className="border-t border-gray-100 pt-1 space-y-0.5 max-h-48 overflow-y-auto">
            {collections.map((col) => (
              <label
                key={col}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(col)}
                  onChange={() => toggle(col)}
                  className="accent-indigo-600 w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-mono">{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BackupPage() {
  const [collections, setCollections] = useState([]);
  const [backupList, setBackupList] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  const [exportCols, setExportCols] = useState([]);
  const [importCols, setImportCols] = useState([]);

  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, type: "", payload: null });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const fileInputRef = useRef(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchCollections = useCallback(async () => {
    try {
      const res = await api.get("/backup/collections");
      setCollections(res.data.data.collections || []);
    } catch {
      toast("Failed to load collections", "error");
    }
  }, [toast]);

  const fetchBackupList = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await api.get("/backup/list");
      setBackupList(res.data.data.backups || []);
    } catch {
      toast("Failed to load backup list", "error");
    } finally {
      setLoadingBackups(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
    fetchBackupList();
  }, [fetchCollections, fetchBackupList]);

  // ── Export & Download ──────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = exportCols.length ? `?collections=${exportCols.join(",")}` : "";
      const res = await api.get(`/backup/export${params}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
      a.download = `smartattend-backup-${timestamp}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Database exported successfully!", "success");
    } catch {
      toast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveBackup = async () => {
    setSaving(true);
    try {
      const body = exportCols.length ? { collections: exportCols } : {};
      await api.post("/backup/save", body);
      toast("Backup saved to server!", "success");
      fetchBackupList();
    } catch {
      toast("Failed to save backup", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSaved = async (filename) => {
    try {
      const res = await api.get(`/backup/download/${encodeURIComponent(filename)}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded ${filename}`, "success");
    } catch {
      toast("Download failed", "error");
    }
  };

  // ── Delete backup ──────────────────────────────────────────────────────────
  const handleDeleteBackup = (filename) => {
    setConfirm({ open: true, type: "delete", payload: filename });
  };

  const confirmDelete = async () => {
    const filename = confirm.payload;
    setConfirm({ open: false, type: "", payload: null });
    try {
      await api.delete(`/backup/${encodeURIComponent(filename)}`);
      toast(`Deleted ${filename}`, "success");
      fetchBackupList();
    } catch {
      toast("Failed to delete backup", "error");
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".zip")) {
      setImportFile(file);
    } else {
      toast("Please drop a valid .zip backup file", "error");
    }
  };

  const handleImportConfirm = () => {
    if (!importFile) return toast("Please select a backup file first", "error");
    setConfirm({ open: true, type: "import", payload: importFile });
  };

  const confirmImport = async () => {
    const file = confirm.payload;
    setConfirm({ open: false, type: "", payload: null });
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (importCols.length) {
        formData.append("collections", importCols.join(","));
      }
      const res = await api.post("/backup/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { imported, skipped, totalDocuments } = res.data.data;
      toast(
        `Restored ${imported.length} collections (${totalDocuments} docs). Skipped: ${skipped.length}`,
        "success"
      );
      setImportFile(null);
    } catch (err) {
      toast(err?.response?.data?.message || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Toast toasts={toasts} remove={removeToast} />

      <ConfirmDialog
        open={confirm.open && confirm.type === "import"}
        title="Restore Database?"
        message="This will REPLACE all existing data in the selected collections with the backup data. This action cannot be undone."
        onConfirm={confirmImport}
        onCancel={() => setConfirm({ open: false, type: "", payload: null })}
        danger={false}
      />

      <ConfirmDialog
        open={confirm.open && confirm.type === "delete"}
        title="Delete Backup?"
        message={`Are you sure you want to permanently delete "${confirm.payload}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, type: "", payload: null })}
        danger={true}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── Page Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 rounded-3xl shadow-xl">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-white/30"
                style={{
                  width: `${80 + i * 60}px`,
                  height: `${80 + i * 60}px`,
                  top: `${-10 + i * 5}%`,
                  right: `${-5 + i * 2}%`,
                }}
              />
            ))}
          </div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <HardDrive size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Database Backup</h1>
                  <p className="text-white/70 text-sm">Export, import, and manage database snapshots</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield size={15} className="text-white/80" />
              <span className="text-white/90 text-sm font-medium">Admin Only</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Collections", value: collections.length, icon: <Database size={16} /> },
              { label: "Saved Backups", value: backupList.length, icon: <FileArchive size={16} /> },
              {
                label: "Total Size",
                value: formatBytes(backupList.reduce((a, b) => a + b.size, 0)),
                icon: <HardDrive size={16} />,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="text-white/70">{s.icon}</div>
                <div>
                  <div className="text-white font-bold text-lg leading-none">{s.value}</div>
                  <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column grid: Export | Import ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Export Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Download size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Export Database</h2>
                  <p className="text-gray-500 text-xs">Download a ZIP snapshot of your data</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Collections to export
                </label>
                <CollectionSelector
                  collections={collections}
                  selected={exportCols}
                  onChange={setExportCols}
                  label="export"
                />
                {exportCols.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {exportCols.map((c) => (
                      <span
                        key={c}
                        className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  id="btn-export-download"
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 disabled:opacity-60"
                >
                  {exporting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  {exporting ? "Exporting…" : "Download Backup"}
                </button>

                <button
                  id="btn-export-save"
                  onClick={handleSaveBackup}
                  disabled={saving}
                  className="flex items-center justify-center gap-2.5 w-full py-3 bg-white border-2 border-emerald-200 hover:border-emerald-400 text-emerald-700 rounded-2xl font-semibold transition-all hover:bg-emerald-50 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Saving…" : "Save to Server"}
                </button>
              </div>

              <p className="text-xs text-gray-400 flex items-start gap-1.5">
                <Shield size={12} className="mt-0.5 shrink-0" />
                Exports each collection as a JSON file bundled in a single ZIP archive.
              </p>
            </div>
          </div>

          {/* Import Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Upload size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Restore Database</h2>
                  <p className="text-gray-500 text-xs">Import a ZIP backup to restore data</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Drag-drop zone */}
              <div
                id="backup-drop-zone"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-violet-500 bg-violet-50"
                    : importFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) setImportFile(f);
                  }}
                />
                {importFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto">
                      <FileArchive size={20} className="text-emerald-600" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{importFile.name}</p>
                    <p className="text-gray-500 text-xs">{formatBytes(importFile.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                      className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mx-auto">
                      <Upload size={20} className="text-violet-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Drop a <span className="font-mono text-violet-600">.zip</span> backup here
                    </p>
                    <p className="text-xs text-gray-400">or click to browse</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Restore only these collections (optional)
                </label>
                <CollectionSelector
                  collections={collections}
                  selected={importCols}
                  onChange={setImportCols}
                  label="import"
                />
              </div>

              <button
                id="btn-restore"
                onClick={handleImportConfirm}
                disabled={importing || !importFile}
                className="flex items-center justify-center gap-2.5 w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {importing ? "Restoring…" : "Restore Database"}
              </button>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Warning:</strong> Restoring will replace all existing data in the selected
                  collections. Export a backup first!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Backup History ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Backup History</h2>
                <p className="text-gray-500 text-xs">Snapshots saved on the server</p>
              </div>
            </div>
            <button
              id="btn-refresh-backups"
              onClick={fetchBackupList}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {loadingBackups ? (
            <div className="flex items-center justify-center py-16">
              <Loader size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : backupList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
                <FileArchive size={30} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No saved backups yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Click "Save to Server" above to create your first snapshot
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {backupList.map((b, idx) => (
                    <tr
                      key={b.filename}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <FileArchive size={16} className="text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 font-mono">{b.filename}</p>
                            {idx === 0 && (
                              <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5">
                                Latest
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(b.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {formatBytes(b.size)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-download-backup-${idx}`}
                            onClick={() => handleDownloadSaved(b.filename)}
                            title="Download"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            id={`btn-delete-backup-${idx}`}
                            onClick={() => handleDeleteBackup(b.filename)}
                            title="Delete"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

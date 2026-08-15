import { useState, useEffect } from "react";
import api from "../../api/axios";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, Users } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [defaultSection, setDefaultSection] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [importMode, setImportMode] = useState("student"); // "student" | "faculty"
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchSemesters();
    fetchDepartments();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await api.get("/academic/semesters");
      setSemesters(res.data.data.semesters);
    } catch (err) {
      console.error("Failed to load semesters", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data.data.departments);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("importType", importMode);
    if (importMode === "student" && defaultSection) {
      formData.append("section", defaultSection);
    }

    try {
      const res = await api.post("/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPreview(res.data.data);
    } catch (err) {
      alert("Failed to generate preview. Please check your file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!file) {
      alert("Please upload a file.");
      return;
    }
    if (importMode === "student" && !selectedSemester) {
      alert("Please select a semester.");
      return;
    }
    if (importMode === "faculty" && !selectedDepartment) {
      alert("Please select a department.");
      return;
    }

    if (!confirm(`Are you sure you want to import these ${importMode === "student" ? "students" : "faculty members"}?`)) return;
    
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("importType", importMode);
    if (importMode === "student") {
      formData.append("semesterId", selectedSemester);
      if (defaultSection) {
        formData.append("section", defaultSection);
      }
    } else {
      formData.append("departmentId", selectedDepartment);
    }

    try {
      const res = await api.post("/import/execute", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data.data.results);
      setPreview(null);
      setFile(null);
    } catch (err) {
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import System</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setImportMode("student"); setPreview(null); setResult(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${importMode === "student" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Students
            </button>
            <button
              onClick={() => { setImportMode("faculty"); setPreview(null); setResult(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${importMode === "faculty" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Faculty
            </button>
          </div>
        </div>
        
        <p className="text-gray-500 mb-8">
          Upload an Excel (.xlsx) file containing {importMode === "student" ? "student" : "faculty"} records to generate accounts automatically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* File Upload Zone */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">1. Upload Roster File</label>
            <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                {file ? (
                  <>
                    <FileSpreadsheet size={40} className="text-blue-500 mb-2" />
                    <p className="text-sm font-medium text-blue-700">{file.name}</p>
                    <p className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={40} className="text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">.xlsx, .xls, or .csv up to 10MB</p>
                  </>
                )}
              </div>
            </div>
            {file && !preview && !result && (
              <button 
                onClick={handlePreview}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Parsing File..." : "Preview Data"}
              </button>
            )}
          </div>

          {/* Target Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              2. Select Destination {importMode === "student" ? "Semester" : "Department"}
            </label>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-[216px] flex flex-col justify-center">
              {importMode === "student" ? (
                <>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">Choose a Semester...</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.courseId?.name}) - {s.academicYearId?.year}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Target Section (Optional, e.g. A)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm mt-3"
                    value={defaultSection}
                    onChange={(e) => setDefaultSection(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Students will be enrolled in this semester. If your file has no Section column, they will be placed in the Target Section above (defaults to A).
                  </p>
                </>
              ) : (
                <>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">Choose a Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    All imported faculty will be assigned to this department.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Data Preview</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">{preview.newStudents} New</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-gray-600">{preview.existingStudents} Existing</span>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">{importMode === "student" ? "Enrollment No" : "Employee ID"}</th>
                  <th className="px-4 py-3 font-medium">Full Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {row.isNew ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium"><CheckCircle size={14}/> New</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-medium"><AlertTriangle size={14}/> Exists</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{importMode === "student" ? row.enrollmentNo : row.employeeId}</td>
                    <td className="px-4 py-3 text-gray-600">{row.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
      </div>
            {preview.totalRows > 5 && (
              <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                Showing 5 of {preview.totalRows} rows
              </div>
            )}
          </div>

          <button 
            onClick={handleExecute}
            disabled={importing || (importMode === "student" ? !selectedSemester : !selectedDepartment)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {importing ? (
              <span className="animate-pulse">Importing Records...</span>
            ) : (
              <>
                <Users size={20} />
                Confirm & Import {preview.totalRows} {importMode === "student" ? "Students" : "Faculty Members"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="bg-green-50 p-8 rounded-3xl border border-green-200 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">Import Successful!</h3>
          <p className="text-green-700 mb-6">Successfully processed {result.totalProcessed} records.</p>
          
          <div className="flex justify-center gap-8 text-left max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm">
            <div>
              <p className="text-sm text-gray-500">Newly Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{result.successful}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Already Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{result.duplicates}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
            </div>
          </div>

          <button 
            onClick={() => setResult(null)}
            className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}

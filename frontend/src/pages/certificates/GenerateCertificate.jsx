import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { studentApi } from "../../api/studentApi.js";
import {
  certificateApi,
  certificateTemplateApi,
} from "../../api/certificateApi.js";

import CertificatePreview from "../../components/certificates/CertificatePreview.jsx";

const normalizeList = (response, nestedKey) => {
  const data = response?.data;

  if (Array.isArray(response)) return response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[nestedKey])) return data.data[nestedKey];
  if (Array.isArray(data?.[nestedKey])) return data[nestedKey];

  return [];
};

const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${
    student?.lastName || ""
  }`.trim();

  return student?.name || fullName || "Student";
};

const getStudentCode = (student) =>
  student?.studentCode || student?.admissionNumber || "-";

const GenerateCertificate = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  const [form, setForm] = useState({
    student: "",
    template: "",
    certificateType: "custom",
    issueDate: new Date().toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [studentResponse, templateResponse] = await Promise.all([
          studentApi.getAll({ limit: 100, status: "active" }),
          certificateTemplateApi.getAll(),
        ]);

        setStudents(normalizeList(studentResponse, "students"));
        setTemplates(normalizeList(templateResponse, "templates"));
      } catch (err) {
        alert(err.response?.data?.message || "Data load nahi hua");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const response = await certificateApi.generate(form);

      setGeneratedCertificate(response.data?.data?.certificate || null);
      alert("Certificate generated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate certificate");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p>Loading students and templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Generate Certificate</h1>
          <p>Select student and template to generate printable certificate.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleGenerate}>
        <label>
          Student
          <select
            name="student"
            value={form.student}
            onChange={handleChange}
            required
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {getStudentName(student)} ({getStudentCode(student)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Template
          <select
            name="template"
            value={form.template}
            onChange={handleChange}
            required
          >
            <option value="">Select Template</option>

            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.templateName} ({template.certificateType})
              </option>
            ))}
          </select>
        </label>

        <label>
          Certificate Type
          <select
            name="certificateType"
            value={form.certificateType}
            onChange={handleChange}
          >
            <option value="belt">Belt</option>
            <option value="participation">Participation</option>
            <option value="achievement">Achievement</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label>
          Issue Date
          <input
            type="date"
            name="issueDate"
            value={form.issueDate}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Generating..." : "Generate Certificate"}
          </button>
        </div>
      </form>

      {generatedCertificate && (
        <div className="card preview-card">
          <CertificatePreview certificate={generatedCertificate} />

          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() =>
                navigate(`/certificates/${generatedCertificate._id}/print`)
              }
            >
              Print Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateCertificate;
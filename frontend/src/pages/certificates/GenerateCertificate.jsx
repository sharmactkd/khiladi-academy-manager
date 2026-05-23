import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../api/studentApi.js";
import {
  certificateApi,
  certificateTemplateApi,
} from "../../api/certificateApi.js";
import CertificatePreview from "../../components/certificates/CertificatePreview.jsx";

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

  useEffect(() => {
    const loadData = async () => {
      const [studentResponse, templateResponse] = await Promise.all([
        studentApi.getAll({ limit: 100, status: "active" }),
        certificateTemplateApi.getAll(),
      ]);

      setStudents(studentResponse.data?.data?.students || []);
      setTemplates(templateResponse.data?.data?.templates || []);
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
          <select name="student" value={form.student} onChange={handleChange} required>
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.studentCode})
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../api/studentApi.js";
import { idCardApi, idCardTemplateApi } from "../../api/idCardApi.js";
import IdCardPreview from "../../components/idCards/IdCardPreview.jsx";

const GenerateIdCard = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [generatedCard, setGeneratedCard] = useState(null);
  const [form, setForm] = useState({
    student: "",
    template: "",
    validTill: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [studentResponse, templateResponse] = await Promise.all([
        studentApi.getAll({ limit: 100, status: "active" }),
        idCardTemplateApi.getAll(),
      ]);

      setStudents(studentResponse.data?.data?.students || []);
      setTemplates(templateResponse.data?.data?.templates || []);
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const response = await idCardApi.generate(form);
      setGeneratedCard(response.data?.data?.idCard || null);
      alert("ID card generated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate ID card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Generate ID Card</h1>
          <p>Select student and template to generate printable ID card.</p>
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
                {template.templateName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Valid Till
          <input
            type="date"
            name="validTill"
            value={form.validTill}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Generating..." : "Generate ID Card"}
          </button>
        </div>
      </form>

      {generatedCard && (
        <div className="card preview-card">
          <IdCardPreview idCard={generatedCard} />

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/id-cards/${generatedCard._id}/print`)}
            >
              Print ID Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateIdCard;
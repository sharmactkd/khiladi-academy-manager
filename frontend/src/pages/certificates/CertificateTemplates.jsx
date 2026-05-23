import { useEffect, useState } from "react";
import { certificateTemplateApi } from "../../api/certificateApi.js";

const initialForm = {
  templateName: "",
  certificateType: "custom",
  backgroundImage: "",
  fields: "studentName,academyName,issueDate",
  isDefault: false,
};

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    const response = await certificateTemplateApi.getAll();
    setTemplates(response.data?.data?.templates || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      layoutJson: {},
      fields: form.fields
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await certificateTemplateApi.update(editingId, payload);
        alert("Certificate template updated successfully");
      } else {
        await certificateTemplateApi.create(payload);
        alert("Certificate template created successfully");
      }

      resetForm();
      await loadTemplates();
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const handleEdit = (template) => {
    setEditingId(template._id);
    setForm({
      templateName: template.templateName || "",
      certificateType: template.certificateType || "custom",
      backgroundImage: template.backgroundImage || "",
      fields: (template.fields || []).join(","),
      isDefault: Boolean(template.isDefault),
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this certificate template?");
    if (!confirmed) return;

    try {
      await certificateTemplateApi.remove(id);
      await loadTemplates();
      alert("Certificate template deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <div className="card">Loading certificate templates...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Certificate Templates</h1>
          <p>Create reusable certificate templates.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="full-width">
          {editingId ? "Edit Template" : "Create Template"}
        </h2>

        <label>
          Template Name
          <input
            name="templateName"
            value={form.templateName}
            onChange={handleChange}
            required
          />
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

        <label className="full-width">
          Background Image URL
          <input
            name="backgroundImage"
            value={form.backgroundImage}
            onChange={handleChange}
          />
        </label>

        <label className="full-width">
          Fields
          <input name="fields" value={form.fields} onChange={handleChange} />
        </label>

        <label className="checkbox-row full-width">
          <input
            type="checkbox"
            name="isDefault"
            checked={form.isDefault}
            onChange={handleChange}
          />
          Set as default for this certificate type
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit">
            {editingId ? "Update Template" : "Create Template"}
          </button>

          {editingId && (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Default</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan="4">No templates found.</td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template._id}>
                  <td>{template.templateName}</td>
                  <td>{template.certificateType}</td>
                  <td>{template.isDefault ? "Yes" : "No"}</td>
                  <td className="table-actions">
                    <button type="button" onClick={() => handleEdit(template)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(template._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CertificateTemplates;
import { useEffect, useState } from "react";
import { idCardTemplateApi } from "../../api/idCardApi.js";

const initialForm = {
  templateName: "",
  logo: "",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  fields: "name,studentCode,beltRank,phone",
  isDefault: false,
};

const IdCardTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await idCardTemplateApi.getAll();
      setTemplates(response.data?.data?.templates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
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
      fields: form.fields
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      frontDesign: {},
      backDesign: {},
    };

    try {
      if (editingId) {
        await idCardTemplateApi.update(editingId, payload);
        alert("Template updated successfully");
      } else {
        await idCardTemplateApi.create(payload);
        alert("Template created successfully");
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
      logo: template.logo || "",
      backgroundColor: template.backgroundColor || "#ffffff",
      textColor: template.textColor || "#111827",
      fields: (template.fields || []).join(","),
      isDefault: Boolean(template.isDefault),
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this ID card template?");
    if (!confirmed) return;

    try {
      await idCardTemplateApi.remove(id);
      await loadTemplates();
      alert("Template deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <div className="card">Loading ID card templates...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>ID Card Templates</h1>
          <p>Create simple reusable ID card templates.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
          Logo URL
          <input name="logo" value={form.logo} onChange={handleChange} />
        </label>

        <label>
          Background Color
          <input
            type="color"
            name="backgroundColor"
            value={form.backgroundColor}
            onChange={handleChange}
          />
        </label>

        <label>
          Text Color
          <input
            type="color"
            name="textColor"
            value={form.textColor}
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
          Set as default template
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
              <th>Default</th>
              <th>Fields</th>
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
                  <td>{template.isDefault ? "Yes" : "No"}</td>
                  <td>{(template.fields || []).join(", ")}</td>
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

export default IdCardTemplates;
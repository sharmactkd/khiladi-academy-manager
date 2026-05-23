import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSkill } from "../../api/skillApi";

const AddSkill = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    martialArt: "Taekwondo",
    skillName: "",
    category: "technique",
    level: "all",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createSkill(form);
      navigate("/skills");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create skill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Skill</h1>
          <p>Add a new skill for assessment and progress tracking.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Martial Art</label>
            <input
              value={form.martialArt}
              onChange={(e) => updateField("martialArt", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Skill Name *</label>
            <input
              value={form.skillName}
              onChange={(e) => updateField("skillName", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="technique">Technique</option>
              <option value="poomsae">Poomsae</option>
              <option value="sparring">Sparring</option>
              <option value="fitness">Fitness</option>
              <option value="discipline">Discipline</option>
              <option value="flexibility">Flexibility</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Level</label>
            <select
              value={form.level}
              onChange={(e) => updateField("level", e.target.value)}
            >
              <option value="all">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="black_belt">Black Belt</option>
            </select>
          </div>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/skills")}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Skill"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSkill;
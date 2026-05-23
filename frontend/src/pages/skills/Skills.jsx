import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteSkill, getSkills } from "../../api/skillApi";

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [filters, setFilters] = useState({
    martialArt: "",
    category: "",
    level: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );

      const res = await getSkills(params);
      setSkills(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this skill?")) return;

    try {
      await deleteSkill(id);
      loadSkills();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to deactivate skill");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Skills</h1>
          <p>Create and manage martial art skill master list.</p>
        </div>

        <Link to="/skills/new" className="btn btn-primary">
          Add Skill
        </Link>
      </div>

      <div className="filter-card">
        <input
          placeholder="Martial Art"
          value={filters.martialArt}
          onChange={(e) => updateFilter("martialArt", e.target.value)}
        />

        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="technique">Technique</option>
          <option value="poomsae">Poomsae</option>
          <option value="sparring">Sparring</option>
          <option value="fitness">Fitness</option>
          <option value="discipline">Discipline</option>
          <option value="flexibility">Flexibility</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.level}
          onChange={(e) => updateFilter("level", e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="black_belt">Black Belt</option>
          <option value="all">All</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>

        <button className="btn btn-secondary" onClick={loadSkills}>
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Skill</th>
              <th>Martial Art</th>
              <th>Category</th>
              <th>Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {skills.length ? (
              skills.map((skill) => (
                <tr key={skill._id}>
                  <td>{skill.skillName}</td>
                  <td>{skill.martialArt}</td>
                  <td>{skill.category}</td>
                  <td>{skill.level}</td>
                  <td>{skill.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDeactivate(skill._id)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No skills found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Skills;
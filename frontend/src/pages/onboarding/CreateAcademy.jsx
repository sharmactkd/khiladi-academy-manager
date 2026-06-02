import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { academyApi } from "../../api/academyApi.js";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const CreateAcademy = () => {
  const navigate = useNavigate();

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    academyName: "",
    martialArts: "Taekwondo",
    countryCode: "+91",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    about: "",
    since: "",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP logo image allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo size 2MB se kam honi chahiye");
      event.target.value = "";
      return;
    }

    setError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("academyName", form.academyName || "");
      formData.append("martialArts", form.martialArts || "");
      formData.append("countryCode", form.countryCode || "+91");
      formData.append("phone", form.phone || "");
      formData.append("email", form.email || "");
      formData.append("address", form.address || "");
      formData.append("city", form.city || "");
      formData.append("state", form.state || "");
      formData.append("country", form.country || "India");
      formData.append("about", form.about || "");
      formData.append("since", form.since || "");

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await academyApi.createAcademy(formData);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Academy creation failed");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Create Academy Profile</h1>
          <p className="muted">
            Add your academy details to complete onboarding.
          </p>
        </div>
      </div>

      <form className="card form wide-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <Input
          label="Academy Name"
          name="academyName"
          value={form.academyName}
          onChange={handleChange}
          placeholder="Khiladi Martial Arts Academy"
          required
        />

        <label className="form-field">
          <span>Academy Logo</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleLogoChange}
          />

          {logoPreview && (
            <div style={{ marginTop: "12px" }}>
              <img
                src={logoPreview}
                alt="Academy logo preview"
                style={{
                  width: "96px",
                  height: "96px",
                  objectFit: "contain",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  background: "#ffffff",
                  padding: "8px",
                }}
              />
            </div>
          )}
        </label>

        <Input
          label="Martial Arts"
          name="martialArts"
          value={form.martialArts}
          onChange={handleChange}
          placeholder="Taekwondo, Karate"
          required
        />

        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="academy@example.com"
        />

        <PhoneLocationFields
          countryCode={form.countryCode || "+91"}
          phone={form.phone || ""}
          country={form.country || "India"}
          state={form.state || ""}
          city={form.city || ""}
          phoneLabel="Phone"
          onChange={updateField}
        />

        <label className="form-field">
          <span>Address</span>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Full academy address"
            rows={3}
          />
        </label>

        <label className="form-field">
          <span>Since</span>
          <select
            name="since"
            value={form.since || ""}
            onChange={handleChange}
          >
            <option value="">Select Year</option>

            {Array.from({ length: currentYear - 1949 }, (_, index) => {
              const year = currentYear - index;

              return (
                <option key={year} value={year}>
                  {year} ({currentYear - year} Years)
                </option>
              );
            })}
          </select>
        </label>

        <label className="form-field">
          <span>About Academy</span>
          <textarea
            name="about"
            value={form.about || ""}
            onChange={handleChange}
            placeholder="Write something about your academy..."
            rows={5}
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Academy"}
        </Button>
      </form>
    </div>
  );
};

export default CreateAcademy;
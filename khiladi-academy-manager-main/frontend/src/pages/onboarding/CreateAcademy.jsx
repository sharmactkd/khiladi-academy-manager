import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { academyApi } from "../../api/academyApi.js";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const MARTIAL_ART_OPTIONS = [
  "Taekwondo",
  "Karate",
  "Judo",
  "Boxing",
  "Kickboxing",
  "Wrestling",
  "MMA",
  "Kung Fu",
  "Wushu",
  "Muay Thai",
  "Brazilian Jiu-Jitsu",
  "Self Defence",
  "Fitness",
  "Yoga",
];

const EMPTY_AFFILIATION = {
  type: "affiliation",
  organizationName: "",
  registrationNumber: "",
};

const CreateAcademy = () => {
  const navigate = useNavigate();

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ownerName: "",
    academyName: "",
    martialArts: ["Taekwondo"],
    countryCode: "+91",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    about: "",
    since: "",
    socialLinks: {
      website: "",
      instagram: "",
      facebook: "",
      youtube: "",
    },
    affiliations: [{ ...EMPTY_AFFILIATION }],
  });

  const currentYear = new Date().getFullYear();

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSocialLink = (field, value) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [field]: value,
      },
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const toggleMartialArt = (item) => {
    setForm((prev) => {
      const current = Array.isArray(prev.martialArts) ? prev.martialArts : [];
      const exists = current.includes(item);

      const next = exists
        ? current.filter((value) => value !== item)
        : [...current, item];

      return {
        ...prev,
        martialArts: next.length ? next : current,
      };
    });
  };

  const addCustomMartialArt = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const value = event.currentTarget.value.trim();

    if (!value) return;

    setForm((prev) => {
      const current = Array.isArray(prev.martialArts) ? prev.martialArts : [];

      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        martialArts: [...current, value],
      };
    });

    event.currentTarget.value = "";
  };

  const updateAffiliation = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      affiliations: prev.affiliations.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addAffiliation = () => {
    setForm((prev) => ({
      ...prev,
      affiliations: [...prev.affiliations, { ...EMPTY_AFFILIATION }],
    }));
  };

  const removeAffiliation = (index) => {
    setForm((prev) => ({
      ...prev,
      affiliations:
        prev.affiliations.length > 1
          ? prev.affiliations.filter((_, itemIndex) => itemIndex !== index)
          : [{ ...EMPTY_AFFILIATION }],
    }));
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

    if (!form.martialArts.length) {
      setError("Please select at least one sport / martial art");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("ownerName", form.ownerName || "");
      formData.append("academyName", form.academyName || "");
      formData.append("martialArts", JSON.stringify(form.martialArts || []));
      formData.append("countryCode", form.countryCode || "+91");
      formData.append("phone", form.phone || "");
      formData.append("email", form.email || "");
      formData.append("address", form.address || "");
      formData.append("city", form.city || "");
      formData.append("state", form.state || "");
      formData.append("country", form.country || "India");
      formData.append("about", form.about || "");
      formData.append("since", form.since || "");
      formData.append("socialLinks", JSON.stringify(form.socialLinks || {}));
      formData.append("affiliations", JSON.stringify(form.affiliations || []));

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

        <div className="grid grid-2">
          <Input
            label="Owner / Director Name"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            placeholder="Abhishek Sharma"
          />

          <Input
            label="Academy Name"
            name="academyName"
            value={form.academyName}
            onChange={handleChange}
            placeholder="Khiladi Martial Arts Academy"
            required
          />

          <Input
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="academy@example.com"
          />

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
        </div>

        <div className="card subtle-card">
          <h3>Sports / Martial Arts</h3>
          <p>Select one or more sports / martial arts your academy teaches.</p>

          <div className="actions" style={{ flexWrap: "wrap", gap: "8px" }}>
            {MARTIAL_ART_OPTIONS.map((item) => {
              const active = form.martialArts.includes(item);

              return (
                <button
                  type="button"
                  key={item}
                  className={active ? "btn btn-primary" : "btn btn-secondary"}
                  onClick={() => toggleMartialArt(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <label style={{ marginTop: 12 }}>
            Add Custom Sport / Martial Art
            <input
              placeholder="Type and press Enter"
              onKeyDown={addCustomMartialArt}
            />
          </label>
        </div>

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
          <span>About Academy</span>
          <textarea
            name="about"
            value={form.about || ""}
            onChange={handleChange}
            placeholder="Write something about your academy..."
            rows={5}
          />
        </label>

        <div className="card subtle-card">
          <h3>Affiliation / Recognition / Registration</h3>
          <p>
            Add organization name and certificate / registration number if
            available.
          </p>

          {form.affiliations.map((item, index) => (
            <div
              key={index}
              className="grid grid-3"
              style={{ alignItems: "end", marginBottom: 12 }}
            >
              <label>
                Type
                <select
                  value={item.type}
                  onChange={(event) =>
                    updateAffiliation(index, "type", event.target.value)
                  }
                >
                  <option value="affiliation">Affiliation</option>
                  <option value="recognition">Recognition</option>
                  <option value="registration">Registration</option>
                </select>
              </label>

              <label>
                Organization Name
                <input
                  value={item.organizationName}
                  onChange={(event) =>
                    updateAffiliation(
                      index,
                      "organizationName",
                      event.target.value
                    )
                  }
                  placeholder="Association / Federation / Trust"
                />
              </label>

              <label>
                Number
                <input
                  value={item.registrationNumber}
                  onChange={(event) =>
                    updateAffiliation(
                      index,
                      "registrationNumber",
                      event.target.value
                    )
                  }
                  placeholder="Certificate / Registration No."
                />
              </label>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => removeAffiliation(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-secondary" onClick={addAffiliation}>
            + Add More
          </button>
        </div>

        <div className="card subtle-card">
          <h3>Website & Social Links</h3>

          <div className="grid grid-2">
            <label>
              Website URL
              <input
                value={form.socialLinks.website}
                onChange={(event) =>
                  updateSocialLink("website", event.target.value)
                }
                placeholder="https://youracademy.com"
              />
            </label>

            <label>
              Instagram
              <input
                value={form.socialLinks.instagram}
                onChange={(event) =>
                  updateSocialLink("instagram", event.target.value)
                }
                placeholder="https://instagram.com/youracademy"
              />
            </label>

            <label>
              Facebook
              <input
                value={form.socialLinks.facebook}
                onChange={(event) =>
                  updateSocialLink("facebook", event.target.value)
                }
                placeholder="https://facebook.com/youracademy"
              />
            </label>

            <label>
              YouTube
              <input
                value={form.socialLinks.youtube}
                onChange={(event) =>
                  updateSocialLink("youtube", event.target.value)
                }
                placeholder="https://youtube.com/@youracademy"
              />
            </label>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Academy"}
        </Button>
      </form>
    </div>
  );
};

export default CreateAcademy;
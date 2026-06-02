import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import { academyApi } from "../../api/academyApi.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";

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

const normalizeMartialArts = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAcademyData = (academyData) => ({
  ...academyData,
  ownerName: academyData?.ownerName || "",
  martialArts: normalizeMartialArts(academyData?.martialArts),
  affiliations:
    Array.isArray(academyData?.affiliations) && academyData.affiliations.length
      ? academyData.affiliations
      : [{ ...EMPTY_AFFILIATION }],
  socialLinks: {
    website: academyData?.socialLinks?.website || "",
    instagram: academyData?.socialLinks?.instagram || "",
    facebook: academyData?.socialLinks?.facebook || "",
    youtube: academyData?.socialLinks?.youtube || "",
  },
});

const AcademyProfile = () => {
  const [academy, setAcademy] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();

  const loadAcademy = async () => {
    try {
      setLoading(true);

      const response = await academyApi.getMyAcademy();
      const academyData = response.data?.data?.academy || null;

      setAcademy(academyData ? normalizeAcademyData(academyData) : null);
      setLogoPreview(academyData?.logo ? getAcademyLogoUrl(academyData) : "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Academy load nahi hui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademy();
  }, []);

  const updateField = (field, value) => {
    setAcademy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSocialLink = (field, value) => {
    setAcademy((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [field]: value,
      },
    }));
  };

  const toggleMartialArt = (item) => {
    setAcademy((prev) => {
      const current = normalizeMartialArts(prev.martialArts);
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

    setAcademy((prev) => {
      const current = normalizeMartialArts(prev.martialArts);

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
    setAcademy((prev) => ({
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
    setAcademy((prev) => ({
      ...prev,
      affiliations: [...(prev.affiliations || []), { ...EMPTY_AFFILIATION }],
    }));
  };

  const removeAffiliation = (index) => {
    setAcademy((prev) => ({
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
      setLogoPreview(academy?.logo ? getAcademyLogoUrl(academy) : "");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP logo allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo size 2MB se kam honi chahiye");
      event.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("ownerName", academy.ownerName || "");
      formData.append("academyName", academy.academyName || "");
      formData.append(
        "martialArts",
        JSON.stringify(normalizeMartialArts(academy.martialArts))
      );
      formData.append("countryCode", academy.countryCode || "+91");
      formData.append("phone", academy.phone || "");
      formData.append("email", academy.email || "");
      formData.append("address", academy.address || "");
      formData.append("city", academy.city || "");
      formData.append("state", academy.state || "");
      formData.append("country", academy.country || "India");
      formData.append("about", academy.about || "");
      formData.append("since", academy.since || "");
      formData.append(
        "affiliations",
        JSON.stringify(academy.affiliations || [])
      );
      formData.append("socialLinks", JSON.stringify(academy.socialLinks || {}));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await academyApi.updateMyAcademy(formData);

      toast.success("Academy profile update ho gayi");
      await loadAcademy();
      setLogoFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Academy update nahi hui");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading academy...</p>;
  if (!academy) return <p>Academy not found.</p>;

  const selectedMartialArts = normalizeMartialArts(academy.martialArts);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Academy Profile</h1>
          <p>Academy details aur logo manage karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <h2>Academy Logo</h2>

          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Academy Logo"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              style={{
                width: "120px",
                height: "120px",
                objectFit: "contain",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                background: "#fff",
                padding: "8px",
              }}
            />
          ) : (
            <p>No logo uploaded.</p>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleLogoChange}
            style={{ marginTop: "12px" }}
          />
        </div>

        <div className="grid grid-2">
          <label>
            Owner / Director Name
            <input
              value={academy.ownerName || ""}
              onChange={(event) => updateField("ownerName", event.target.value)}
              placeholder="Owner / Director Name"
            />
          </label>

          <label>
            Academy Name
            <input
              value={academy.academyName || ""}
              onChange={(event) =>
                updateField("academyName", event.target.value)
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={academy.email || ""}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label>
            Since
            <select
              value={academy.since || ""}
              onChange={(event) => updateField("since", event.target.value)}
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

          <PhoneLocationFields
            countryCode={academy.countryCode || "+91"}
            phone={academy.phone || ""}
            country={academy.country || "India"}
            state={academy.state || ""}
            city={academy.city || ""}
            phoneLabel="Phone"
            onChange={updateField}
          />
        </div>

        <div className="card subtle-card">
          <h3>Sports / Martial Arts</h3>

          <div className="actions" style={{ flexWrap: "wrap", gap: "8px" }}>
            {MARTIAL_ART_OPTIONS.map((item) => {
              const active = selectedMartialArts.includes(item);

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

        <label>
          Address
          <textarea
            value={academy.address || ""}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </label>

        <label className="form-group-full">
          About Academy
          <textarea
            value={academy.about || ""}
            onChange={(event) => updateField("about", event.target.value)}
            placeholder="Write something about your academy..."
            rows={5}
          />
        </label>

        <div className="card subtle-card">
          <h3>Affiliation / Recognition / Registration</h3>

          {(academy.affiliations || [{ ...EMPTY_AFFILIATION }]).map(
            (item, index) => (
              <div
                key={index}
                className="grid grid-3"
                style={{ alignItems: "end", marginBottom: 12 }}
              >
                <label>
                  Type
                  <select
                    value={item.type || "affiliation"}
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
                    value={item.organizationName || ""}
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
                    value={item.registrationNumber || ""}
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
            )
          )}

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
                value={academy.socialLinks?.website || ""}
                onChange={(event) =>
                  updateSocialLink("website", event.target.value)
                }
                placeholder="https://youracademy.com"
              />
            </label>

            <label>
              Instagram
              <input
                value={academy.socialLinks?.instagram || ""}
                onChange={(event) =>
                  updateSocialLink("instagram", event.target.value)
                }
                placeholder="https://instagram.com/youracademy"
              />
            </label>

            <label>
              Facebook
              <input
                value={academy.socialLinks?.facebook || ""}
                onChange={(event) =>
                  updateSocialLink("facebook", event.target.value)
                }
                placeholder="https://facebook.com/youracademy"
              />
            </label>

            <label>
              YouTube
              <input
                value={academy.socialLinks?.youtube || ""}
                onChange={(event) =>
                  updateSocialLink("youtube", event.target.value)
                }
                placeholder="https://youtube.com/@youracademy"
              />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Update Academy"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcademyProfile;
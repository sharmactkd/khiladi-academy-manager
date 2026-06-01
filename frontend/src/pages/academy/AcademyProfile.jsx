import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";

import { academyApi } from "../../api/academyApi.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";

const DEFAULT_COUNTRY_CODE = "IN";

const getFlagEmoji = (countryCode = "") => {
  if (!countryCode) return "";

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
};

const findCountryCodeByName = (countryName = "") => {
  const countries = Country.getAllCountries();
  const normalized = String(countryName || "").trim().toLowerCase();

  if (!normalized) return DEFAULT_COUNTRY_CODE;

  const matched = countries.find(
    (country) =>
      country.name.toLowerCase() === normalized ||
      country.isoCode.toLowerCase() === normalized
  );

  return matched?.isoCode || DEFAULT_COUNTRY_CODE;
};

const findStateCodeByName = (countryCode, stateName = "") => {
  const states = State.getStatesOfCountry(countryCode);
  const normalized = String(stateName || "").trim().toLowerCase();

  if (!normalized) return "";

  const matched = states.find(
    (state) =>
      state.name.toLowerCase() === normalized ||
      state.isoCode.toLowerCase() === normalized
  );

  return matched?.isoCode || "";
};

const AcademyProfile = () => {
  const [academy, setAcademy] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] =
    useState(DEFAULT_COUNTRY_CODE);
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);

  const states = useMemo(
    () => State.getStatesOfCountry(selectedCountryCode),
    [selectedCountryCode]
  );

  const cities = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode);
  }, [selectedCountryCode, selectedStateCode]);

  const loadAcademy = async () => {
    try {
      setLoading(true);

      const response = await academyApi.getMyAcademy();
      const academyData = response.data?.data?.academy || null;

      if (academyData) {
        const countryCode = findCountryCodeByName(academyData.country);
        const stateCode = findStateCodeByName(countryCode, academyData.state);

        setSelectedCountryCode(countryCode);
        setSelectedStateCode(stateCode);
      }

      setAcademy(academyData);
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

  const handleCountryChange = (event) => {
    const countryCode = event.target.value;
    const country = countries.find((item) => item.isoCode === countryCode);

    setSelectedCountryCode(countryCode);
    setSelectedStateCode("");

    updateField("country", country?.name || "");
    updateField("state", "");
    updateField("city", "");
  };

  const handleStateChange = (event) => {
    const stateCode = event.target.value;
    const state = states.find((item) => item.isoCode === stateCode);

    setSelectedStateCode(stateCode);

    updateField("state", state?.name || "");
    updateField("city", "");
  };

  const handleCityChange = (event) => {
    updateField("city", event.target.value);
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

      formData.append("academyName", academy.academyName || "");
      formData.append(
        "martialArts",
        Array.isArray(academy.martialArts)
          ? academy.martialArts.join(",")
          : academy.martialArts || ""
      );
      formData.append("countryCode", academy.countryCode || "+91");
      formData.append("phone", academy.phone || "");
      formData.append("email", academy.email || "");
      formData.append("address", academy.address || "");
      formData.append("city", academy.city || "");
      formData.append("state", academy.state || "");
      formData.append("country", academy.country || "India");
      formData.append("pincode", academy.pincode || "");

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
            Academy Name
            <input
              value={academy.academyName || ""}
              onChange={(event) =>
                updateField("academyName", event.target.value)
              }
            />
          </label>

          <label>
            Martial Arts
            <input
              value={
                Array.isArray(academy.martialArts)
                  ? academy.martialArts.join(", ")
                  : academy.martialArts || ""
              }
              onChange={(event) =>
                updateField("martialArts", event.target.value)
              }
            />
          </label>

          <label>
            Phone
            <input
              value={academy.phone || ""}
              onChange={(event) => updateField("phone", event.target.value)}
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
            Country
            <select
              value={selectedCountryCode}
              onChange={handleCountryChange}
            >
              {countries.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
  {getFlagEmoji(country.isoCode)} {country.name}
</option>
              ))}
            </select>
          </label>

          <label>
            State
            <select
              value={selectedStateCode}
              onChange={handleStateChange}
              disabled={!selectedCountryCode}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            District / City
            <select
              value={academy.city || ""}
              onChange={handleCityChange}
              disabled={!selectedStateCode}
            >
              <option value="">Select District / City</option>
              {cities.map((city) => (
                <option key={`${city.name}-${city.latitude}`} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pincode
            <input
              value={academy.pincode || ""}
              onChange={(event) => updateField("pincode", event.target.value)}
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
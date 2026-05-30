import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";

import { getBranchById, updateBranch } from "../../api/branchApi";

const DEFAULT_COUNTRY_ISO = "IN";
const DEFAULT_DIAL_CODE = "+91";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (digits) => {
  const clean = onlyDigits(digits);

  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 4)}-${clean.slice(4)}`;

  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 10)}`;
};

const EditBranch = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const countries = useMemo(() => Country.getAllCountries(), []);

  const [selectedCountryIso, setSelectedCountryIso] =
    useState(DEFAULT_COUNTRY_ISO);
  const [selectedStateIso, setSelectedStateIso] = useState("");

  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [countryCodeSearch, setCountryCodeSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const [displayPhone, setDisplayPhone] = useState("");

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCountry = useMemo(() => {
    return (
      countries.find((country) => country.isoCode === selectedCountryIso) ||
      countries.find((country) => country.isoCode === DEFAULT_COUNTRY_ISO)
    );
  }, [countries, selectedCountryIso]);

  const states = useMemo(() => {
    if (!selectedCountryIso) return [];
    return State.getStatesOfCountry(selectedCountryIso);
  }, [selectedCountryIso]);

  const districts = useMemo(() => {
    if (!selectedCountryIso || !selectedStateIso) return [];
    return City.getCitiesOfState(selectedCountryIso, selectedStateIso);
  }, [selectedCountryIso, selectedStateIso]);

  const countryCodeOptions = useMemo(() => {
    return countries
      .map((country) => ({
        name: country.name,
        isoCode: country.isoCode,
        dialCode: country.phonecode ? `+${country.phonecode}` : "",
      }))
      .filter((country) => country.dialCode);
  }, [countries]);

  const filteredCountryCodeOptions = useMemo(() => {
    const search = countryCodeSearch.trim().toLowerCase();

    if (!search) return countryCodeOptions;

    return countryCodeOptions.filter((country) => {
      return (
        country.name.toLowerCase().includes(search) ||
        country.isoCode.toLowerCase().includes(search) ||
        country.dialCode.includes(search)
      );
    });
  }, [countryCodeOptions, countryCodeSearch]);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return countries;

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(search) ||
        country.isoCode.toLowerCase().includes(search)
      );
    });
  }, [countries, countrySearch]);

  const selectedDialCode = form?.countryCode || DEFAULT_DIAL_CODE;
  const isIndiaPhone = selectedDialCode === "+91";

  const selectedDialCountry =
    countryCodeOptions.find((country) => country.dialCode === selectedDialCode) ||
    countryCodeOptions.find((country) => country.isoCode === DEFAULT_COUNTRY_ISO);

  const loadBranch = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getBranchById(id);
      const branch = res.data?.branch || res.data?.data || res.data;

      const country =
        countries.find((item) => item.name === branch.country) ||
        countries.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO);

      const countryIso = country?.isoCode || DEFAULT_COUNTRY_ISO;
      const countryStates = State.getStatesOfCountry(countryIso);
      const state =
        countryStates.find((item) => item.name === branch.state) || null;

      setSelectedCountryIso(countryIso);
      setSelectedStateIso(state?.isoCode || "");

      const rawPhone = onlyDigits(branch.phone || "");

      setDisplayPhone(formatPhone(rawPhone));

      setForm({
        branchName: branch.branchName || "",
        branchCode: branch.branchCode || "",
        countryCode: branch.countryCode || DEFAULT_DIAL_CODE,
        phone: rawPhone,
        email: branch.email || "",
        address: branch.address || "",
        city: branch.city || "",
        state: branch.state || "",
        country: branch.country || "India",
        pincode: branch.pincode || "",
        isMainBranch: Boolean(branch.isMainBranch),
        isActive: Boolean(branch.isActive),
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load branch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countries.length) {
      loadBranch();
    }
  }, [id, countries.length]);

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCountryCodeSelect = (country) => {
    const nextDialCode = country.dialCode;

    setForm((prev) => {
      const digits = onlyDigits(prev.phone);
      const nextPhone =
        nextDialCode === "+91" ? digits.slice(0, 10) : digits;

      return {
        ...prev,
        countryCode: nextDialCode,
        phone: nextPhone,
      };
    });

    setDisplayPhone((prev) => {
      const digits = onlyDigits(prev);
      const finalDigits =
        nextDialCode === "+91" ? digits.slice(0, 10) : digits;

      return formatPhone(finalDigits);
    });

    setCountryCodeSearch("");
    setShowCountryCodeDropdown(false);
  };

  const handlePhoneChange = (event) => {
    let digits = onlyDigits(event.target.value);

    if (isIndiaPhone) {
      digits = digits.slice(0, 10);
    }

    setDisplayPhone(formatPhone(digits));

    setForm((prev) => ({
      ...prev,
      phone: digits,
    }));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountryIso(country.isoCode);
    setSelectedStateIso("");

    setForm((prev) => ({
      ...prev,
      country: country.name || "",
      state: "",
      city: "",
    }));

    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const handleStateChange = (event) => {
    const isoCode = event.target.value;
    const state = states.find((item) => item.isoCode === isoCode);

    setSelectedStateIso(isoCode);

    setForm((prev) => ({
      ...prev,
      state: state?.name || "",
      city: "",
    }));
  };

  const handleDistrictChange = (event) => {
    setForm((prev) => ({
      ...prev,
      city: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (isIndiaPhone && form.phone && form.phone.length !== 10) {
        setError("India phone number must be exactly 10 digits");
        setSaving(false);
        return;
      }

      await updateBranch(id, {
        ...form,
        phone: displayPhone,
      });

      navigate(`/branches/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update branch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page">Loading branch...</div>;
  if (!form) return <div className="page">Branch not found.</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Edit Branch</h1>
          <p>Update branch details.</p>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Branch Name *</label>
            <input
              value={form.branchName}
              onChange={(event) =>
                updateField("branchName", event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Branch Code *</label>
            <input
              value={form.branchCode}
              onChange={(event) =>
                updateField("branchCode", event.target.value)
              }
              required
            />
          </div>

          <div className="form-group form-group-full">
            <label>Phone</label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: "12px",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCountryCodeDropdown((prev) => !prev);
                    setShowCountryDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    minHeight: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    background: "#ffffff",
                    color: "#111827",
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedDialCountry?.isoCode && (
                      <ReactCountryFlag
                        countryCode={selectedDialCountry.isoCode}
                        svg
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                        }}
                      />
                    )}

                    <span>{selectedDialCode}</span>
                  </span>

                  <span>▾</span>
                </button>

                {showCountryCodeDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "10px" }}>
                      <input
                        type="text"
                        value={countryCodeSearch}
                        onChange={(event) =>
                          setCountryCodeSearch(event.target.value)
                        }
                        placeholder="Search country..."
                        style={{
                          width: "100%",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "9px 10px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        maxHeight: "260px",
                        overflowY: "auto",
                      }}
                    >
                      {filteredCountryCodeOptions.length ? (
                        filteredCountryCodeOptions.map((country) => (
                          <button
                            type="button"
                            key={`${country.isoCode}-${country.dialCode}`}
                            onClick={() => handleCountryCodeSelect(country)}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              border: 0,
                              background:
                                country.dialCode === selectedDialCode
                                  ? "#eff6ff"
                                  : "#ffffff",
                              color: "#111827",
                              padding: "10px 12px",
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                          >
                            <ReactCountryFlag
                              countryCode={country.isoCode}
                              svg
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                              }}
                            />
                            <span style={{ flex: 1 }}>{country.name}</span>
                            <strong>{country.dialCode}</strong>
                          </button>
                        ))
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            padding: "12px",
                            color: "#6b7280",
                          }}
                        >
                          No country found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input
                name="phone"
                type="text"
                inputMode="numeric"
                value={displayPhone}
                onChange={handlePhoneChange}
                placeholder="0000-00-0000"
                autoComplete="tel"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Pincode</label>
            <input
              value={form.pincode}
              onChange={(event) => updateField("pincode", event.target.value)}
            />
          </div>

          <div className="form-group form-group-full">
            <label>Address</label>
            <textarea
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Country</label>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setShowCountryDropdown((prev) => !prev);
                  setShowCountryCodeDropdown(false);
                }}
                style={{
                  width: "100%",
                  minHeight: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ReactCountryFlag
                    countryCode={selectedCountry?.isoCode || "IN"}
                    svg
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                    }}
                  />

                  <span>{selectedCountry?.name || "India"}</span>
                </span>

                <span>▾</span>
              </button>

              {showCountryDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "48px",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "10px" }}>
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(event) => setCountrySearch(event.target.value)}
                      placeholder="Search country..."
                      style={{
                        width: "100%",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "9px 10px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredCountries.length ? (
                      filteredCountries.map((country) => (
                        <button
                          type="button"
                          key={country.isoCode}
                          onClick={() => handleCountrySelect(country)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            border: 0,
                            background:
                              country.isoCode === selectedCountryIso
                                ? "#eff6ff"
                                : "#ffffff",
                            color: "#111827",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <ReactCountryFlag
                            countryCode={country.isoCode}
                            svg
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                            }}
                          />

                          <span>{country.name}</span>
                        </button>
                      ))
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          padding: "12px",
                          color: "#6b7280",
                        }}
                      >
                        No country found.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>State</label>
            <select
              value={selectedStateIso}
              onChange={handleStateChange}
              disabled={!states.length}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>District</label>
            <select
              value={form.city}
              onChange={handleDistrictChange}
              disabled={!districts.length}
            >
              <option value="">Select District</option>
              {districts.map((district) => (
                <option key={district.name} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={form.isMainBranch}
              onChange={(event) =>
                updateField("isMainBranch", event.target.checked)
              }
            />
            Main Branch
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/branches/${id}`)}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Update Branch"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBranch;
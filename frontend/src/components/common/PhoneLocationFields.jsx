import { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";
import { Plus, Trash2 } from "lucide-react";
import "./PhoneLocationFields.module.css";

const DEFAULT_COUNTRY_ISO = "IN";
const DEFAULT_DIAL_CODE = "+91";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (digits, dialCode = DEFAULT_DIAL_CODE) => {
  const clean = onlyDigits(digits).slice(0, dialCode === "+91" ? 10 : 15);
  if (dialCode !== "+91") return clean;
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 10)}`;
};

const PhoneLocationFields = ({
  afterPhone = null,
  phoneTrailingContent = null,
  showAddPhone = true,
  countryCode = DEFAULT_DIAL_CODE,
  phone = "",
  phoneNumbers = [],
  maxPhones = 4,
  country = "India",
  state = "",
  city = "",
  
  onChange,
  phoneLabel = "Phone",
  showPhone = true,
  showLocation = true,
}) => {
  const countries = useMemo(() => Country.getAllCountries(), []);

  const normalizedPhones = useMemo(() => {
    const source = Array.isArray(phoneNumbers) ? phoneNumbers : [];
    const rows = source
      .map((item, index) => ({
        countryCode: String(item?.countryCode || DEFAULT_DIAL_CODE),
        phone: String(item?.phone || ""),
        isPrimary: index === 0,
      }))
      .slice(0, maxPhones);

    if (!rows.length) {
      rows.push({ countryCode, phone, isPrimary: true });
    } else {
      rows[0] = { countryCode, phone, isPrimary: true };
    }

    return rows;
  }, [countryCode, maxPhones, phone, phoneNumbers]);

  const initialCountry =
    countries.find((item) => item.name === country) ||
    countries.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO);

  const [selectedCountryIso, setSelectedCountryIso] = useState(
    initialCountry?.isoCode || DEFAULT_COUNTRY_ISO
  );

  const stateList = State.getStatesOfCountry(selectedCountryIso);

  const initialState = stateList.find((item) => item.name === state);

  const [selectedStateIso, setSelectedStateIso] = useState(
    initialState?.isoCode || ""
  );

  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [openAdditionalCodeIndex, setOpenAdditionalCodeIndex] = useState(null);
  const [additionalCodeSearch, setAdditionalCodeSearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    const nextCountry =
      countries.find((item) => item.name === country) ||
      countries.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO);
    const nextCountryIso = nextCountry?.isoCode || DEFAULT_COUNTRY_ISO;
    const nextState = State.getStatesOfCountry(nextCountryIso).find(
      (item) => item.name === state,
    );
    setSelectedCountryIso(nextCountryIso);
    setSelectedStateIso(nextState?.isoCode || "");
  }, [countries, country, state]);

  const states = useMemo(
    () => State.getStatesOfCountry(selectedCountryIso),
    [selectedCountryIso]
  );

  const districts = useMemo(() => {
    if (!selectedCountryIso || !selectedStateIso) return [];
    return City.getCitiesOfState(selectedCountryIso, selectedStateIso);
  }, [selectedCountryIso, selectedStateIso]);

  const countryCodeOptions = useMemo(() => {
    return countries
      .map((item) => ({
        name: item.name,
        isoCode: item.isoCode,
        dialCode: item.phonecode ? `+${item.phonecode}` : "",
      }))
      .filter((item) => item.dialCode);
  }, [countries]);

  const selectedDialCountry =
    countryCodeOptions.find((item) => item.dialCode === countryCode) ||
    countryCodeOptions.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO);

  const filteredCountryCodes = countryCodeOptions.filter((item) => {
    const search = codeSearch.toLowerCase().trim();
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.isoCode.toLowerCase().includes(search) ||
      item.dialCode.includes(search)
    );
  });

  const filteredAdditionalCountryCodes = countryCodeOptions.filter((item) => {
    const search = additionalCodeSearch.toLowerCase().trim();
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.isoCode.toLowerCase().includes(search) ||
      item.dialCode.includes(search)
    );
  });

  const filteredCountries = countries.filter((item) => {
    const search = countrySearch.toLowerCase().trim();
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.isoCode.toLowerCase().includes(search)
    );
  });

  const update = (key, value) => {
    onChange?.(key, value);
  };

  const updatePhoneNumbers = (nextPhones) => {
    const normalized = nextPhones.slice(0, maxPhones).map((item, index) => ({
      countryCode: item.countryCode || DEFAULT_DIAL_CODE,
      phone: item.phone || "",
      isPrimary: index === 0,
    }));

    update("phoneNumbers", normalized);
    update("countryCode", normalized[0]?.countryCode || DEFAULT_DIAL_CODE);
    update("phone", normalized[0]?.phone || "");
  };

  const handleCountryCodeSelect = (item) => {
    const digits =
      item.dialCode === "+91" ? onlyDigits(phone).slice(0, 10) : onlyDigits(phone);

    update("countryCode", item.dialCode);
    update("phone", formatPhone(digits, item.dialCode));
    updatePhoneNumbers(
      normalizedPhones.map((number, index) =>
        index === 0
          ? { ...number, countryCode: item.dialCode, phone: formatPhone(digits, item.dialCode) }
          : number
      )
    );

    setCodeSearch("");
    setShowCodeDropdown(false);
  };

  const handlePhoneChange = (event) => {
    const digits =
      countryCode === "+91"
        ? onlyDigits(event.target.value).slice(0, 10)
        : onlyDigits(event.target.value).slice(0, 15);

    update("phone", formatPhone(digits, countryCode));
    updatePhoneNumbers(
      normalizedPhones.map((number, index) =>
        index === 0 ? { ...number, phone: formatPhone(digits, countryCode) } : number
      )
    );
  };

  const addPhoneNumber = () => {
    if (normalizedPhones.length >= maxPhones) return;
    updatePhoneNumbers([
      ...normalizedPhones,
      { countryCode: DEFAULT_DIAL_CODE, phone: "", isPrimary: false },
    ]);
  };

  const updateAdditionalPhone = (index, field, value) => {
    const next = normalizedPhones.map((number, itemIndex) => {
      if (itemIndex !== index) return number;

      if (field === "phone") {
        const digits =
          number.countryCode === "+91"
            ? onlyDigits(value).slice(0, 10)
            : onlyDigits(value).slice(0, 15);
        return { ...number, phone: formatPhone(digits, number.countryCode) };
      }

      return { ...number, [field]: value };
    });

    updatePhoneNumbers(next);
  };

  const removePhoneNumber = (index) => {
    if (index === 0) return;
    updatePhoneNumbers(
      normalizedPhones.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleCountrySelect = (item) => {
    setSelectedCountryIso(item.isoCode);
    setSelectedStateIso("");

    update("country", item.name);
    update("state", "");
    update("city", "");

    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const handleStateChange = (event) => {
    const iso = event.target.value;
    const selected = states.find((item) => item.isoCode === iso);

    setSelectedStateIso(iso);
    update("state", selected?.name || "");
    update("city", "");
  };

  return (
    <>
      {showPhone ? <div className="form-group form-group-full phone-location-phone-group">
        <div className="phone-location-phone-heading">
          <label>{phoneLabel}</label>
          <span>{normalizedPhones.length}/{maxPhones}</span>
        </div>

        <div
          className={`phone-location-primary-row${
            phoneTrailingContent ? " phone-location-primary-row--with-trailing" : ""
          }`}
        >
          <div className="phone-location-code-picker">
            <button
              type="button"
              className="phone-location-code-button"
              aria-label="Choose country code for primary phone"
              aria-expanded={showCodeDropdown}
              onClick={() => {
                setShowCodeDropdown((prev) => !prev);
                setShowCountryDropdown(false);
                setOpenAdditionalCodeIndex(null);
                setCodeSearch("");
              }}
            >
              <span>
                {selectedDialCountry?.isoCode && (
                  <ReactCountryFlag
                    countryCode={selectedDialCountry.isoCode}
                    svg
                    className="phone-location-country-flag"
                  />
                )}
                <span>{countryCode || DEFAULT_DIAL_CODE}</span>
              </span>
              <span aria-hidden="true">▾</span>
            </button>

            {showCodeDropdown && (
              <div className="phone-location-code-menu">
                <div className="phone-location-code-search">
                  <input
                    autoFocus
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    placeholder="Search country..."
                    aria-label="Search primary phone country code"
                  />
                </div>

                <div className="phone-location-code-options">
                  {filteredCountryCodes.map((item) => (
                    <button
                      type="button"
                      key={`${item.isoCode}-${item.dialCode}`}
                      className={
                        item.dialCode === countryCode ? "is-selected" : ""
                      }
                      onClick={() => handleCountryCodeSelect(item)}
                    >
                      <ReactCountryFlag
                        countryCode={item.isoCode}
                        svg
                        className="phone-location-country-flag"
                      />
                      <span>{item.name}</span>
                      <strong>{item.dialCode}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            value={phone || ""}
            onChange={handlePhoneChange}
            inputMode="numeric"
            placeholder="9876-54-3210"
            maxLength={countryCode === "+91" ? 12 : 20}
          />

          {showAddPhone ? (
            <button
              type="button"
              className="phone-location-add-button"
              onClick={addPhoneNumber}
              disabled={normalizedPhones.length >= maxPhones}
            >
              <Plus size={15} aria-hidden="true" />
              {normalizedPhones.length >= maxPhones ? `Maximum ${maxPhones}` : "Add More"}
            </button>
          ) : null}

          {phoneTrailingContent ? (
            <div className="phone-location-primary-trailing">
              {phoneTrailingContent}
            </div>
          ) : null}
        </div>

        {normalizedPhones.slice(1).map((number, offset) => {
          const index = offset + 1;
          const selectedAdditionalCountry =
            countryCodeOptions.find(
              (item) => item.dialCode === number.countryCode
            ) ||
            countryCodeOptions.find(
              (item) => item.isoCode === DEFAULT_COUNTRY_ISO
            );

          return (
            <div className="phone-location-extra-row" key={`phone-${index}`}>
              <div className="phone-location-code-picker">
                <button
                  type="button"
                  className="phone-location-code-button"
                  aria-label={`Choose country code for phone ${index + 1}`}
                  aria-expanded={openAdditionalCodeIndex === index}
                  onClick={() => {
                    setOpenAdditionalCodeIndex((current) =>
                      current === index ? null : index
                    );
                    setAdditionalCodeSearch("");
                    setShowCodeDropdown(false);
                    setShowCountryDropdown(false);
                  }}
                >
                  <span>
                    {selectedAdditionalCountry?.isoCode ? (
                      <ReactCountryFlag
                        countryCode={selectedAdditionalCountry.isoCode}
                        svg
                        className="phone-location-country-flag"
                      />
                    ) : null}
                    <span>{number.countryCode || DEFAULT_DIAL_CODE}</span>
                  </span>
                  <span aria-hidden="true">▾</span>
                </button>

                {openAdditionalCodeIndex === index ? (
                  <div className="phone-location-code-menu">
                    <div className="phone-location-code-search">
                      <input
                        autoFocus
                        value={additionalCodeSearch}
                        onChange={(event) =>
                          setAdditionalCodeSearch(event.target.value)
                        }
                        placeholder="Search country..."
                        aria-label="Search country code"
                      />
                    </div>

                    <div className="phone-location-code-options">
                      {filteredAdditionalCountryCodes.map((item) => (
                        <button
                          type="button"
                          key={`${index}-${item.isoCode}-${item.dialCode}`}
                          className={
                            item.dialCode === number.countryCode
                              ? "is-selected"
                              : ""
                          }
                          onClick={() => {
                            updateAdditionalPhone(
                              index,
                              "countryCode",
                              item.dialCode
                            );
                            setOpenAdditionalCodeIndex(null);
                            setAdditionalCodeSearch("");
                          }}
                        >
                          <ReactCountryFlag
                            countryCode={item.isoCode}
                            svg
                            className="phone-location-country-flag"
                          />
                          <span>{item.name}</span>
                          <strong>{item.dialCode}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <input
                value={number.phone}
                onChange={(event) =>
                  updateAdditionalPhone(index, "phone", event.target.value)
                }
                inputMode="numeric"
                placeholder={`Additional phone ${index + 1}`}
                maxLength={number.countryCode === "+91" ? 12 : 20}
              />

              <button
                type="button"
                className="phone-location-remove-button"
                onClick={() => removePhoneNumber(index)}
                aria-label={`Remove phone ${index + 1}`}
                title="Remove phone number"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div> : null}

      {showPhone ? afterPhone : null}

      {showLocation && (
        <>
          <div className="form-group" style={{ position: "relative" }}>
            <label>Country</label>

            <button
              type="button"
              onClick={() => setShowCountryDropdown((prev) => !prev)}
              style={{
                width: "100%",
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
                color: "#111827",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ReactCountryFlag
                  countryCode={selectedCountryIso}
                  svg
                  style={{ width: 22, height: 22, borderRadius: "50%" }}
                />
                {country || "India"}
              </span>
              <span>▾</span>
            </button>

            {showCountryDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: 70,
                  left: 0,
                  right: 0,
                  zIndex: 70,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 10 }}>
                  <input
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {filteredCountries.map((item) => (
                    <button
                      type="button"
                      key={item.isoCode}
                      onClick={() => handleCountrySelect(item)}
                      style={{
                        width: "100%",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        border: 0,
                        background:
                          item.isoCode === selectedCountryIso
                            ? "#eff6ff"
                            : "#fff",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <ReactCountryFlag
                        countryCode={item.isoCode}
                        svg
                        style={{ width: 22, height: 22, borderRadius: "50%" }}
                      />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>State</label>
            <select value={selectedStateIso} onChange={handleStateChange}>
              <option value="">Select State</option>
              {states.map((item) => (
                <option key={item.isoCode} value={item.isoCode}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>District</label>
            <select
              value={city || ""}
              onChange={(event) => update("city", event.target.value)}
              disabled={!selectedStateIso}
            >
              <option value="">Select District</option>
              {districts.map((item) => (
                <option key={`${item.name}-${item.latitude}`} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

        
        </>
      )}
    </>
  );
};

export default PhoneLocationFields;

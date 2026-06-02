import { useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";

const DEFAULT_COUNTRY_ISO = "IN";
const DEFAULT_DIAL_CODE = "+91";

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const formatPhone = (digits) => {
  const clean = onlyDigits(digits);
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 10)}`;
};

const PhoneLocationFields = ({
  countryCode = DEFAULT_DIAL_CODE,
  phone = "",
  country = "India",
  state = "",
  city = "",
  
  onChange,
  phoneLabel = "Phone",
  showLocation = true,
}) => {
  const countries = useMemo(() => Country.getAllCountries(), []);

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
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

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

  const handleCountryCodeSelect = (item) => {
    const digits =
      item.dialCode === "+91" ? onlyDigits(phone).slice(0, 10) : onlyDigits(phone);

    update("countryCode", item.dialCode);
    update("phone", formatPhone(digits));

    setCodeSearch("");
    setShowCodeDropdown(false);
  };

  const handlePhoneChange = (event) => {
    const digits =
      countryCode === "+91"
        ? onlyDigits(event.target.value).slice(0, 10)
        : onlyDigits(event.target.value);

    update("phone", formatPhone(digits));
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
      <div className="form-group form-group-full">
        <label>{phoneLabel}</label>

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
                setShowCodeDropdown((prev) => !prev);
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
                background: "#fff",
                color: "#111827",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedDialCountry?.isoCode && (
                  <ReactCountryFlag
                    countryCode={selectedDialCountry.isoCode}
                    svg
                    style={{ width: 22, height: 22, borderRadius: "50%" }}
                  />
                )}
                <span>{countryCode || DEFAULT_DIAL_CODE}</span>
              </span>
              <span>▾</span>
            </button>

            {showCodeDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  left: 0,
                  right: 0,
                  zIndex: 80,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 10 }}>
                  <input
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    placeholder="Search country..."
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {filteredCountryCodes.map((item) => (
                    <button
                      type="button"
                      key={`${item.isoCode}-${item.dialCode}`}
                      onClick={() => handleCountryCodeSelect(item)}
                      style={{
                        width: "100%",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        border: 0,
                        background:
                          item.dialCode === countryCode ? "#eff6ff" : "#fff",
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
                      <strong style={{ marginLeft: "auto" }}>
                        {item.dialCode}
                      </strong>
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
        </div>
      </div>

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
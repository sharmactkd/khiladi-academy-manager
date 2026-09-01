import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Country from "country-state-city/lib/country.js";
import State from "country-state-city/lib/state.js";
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

const getFloatingMenuPosition = (button, preferredWidth) => {
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const spaceBelow = viewportHeight - rect.bottom - 12;
  const spaceAbove = rect.top - 12;
  const openAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    180,
    Math.min(340, openAbove ? spaceAbove : spaceBelow),
  );
  const width = Math.min(preferredWidth, viewportWidth - 16);

  return {
    left: Math.min(
      Math.max(8, rect.left),
      Math.max(8, viewportWidth - width - 8),
    ),
    top: openAbove
      ? Math.max(8, rect.top - maxHeight - 6)
      : rect.bottom + 6,
    width,
    maxHeight,
  };
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
      .map((item, index) => {
        const itemCountryCode = String(
          item?.countryCode || DEFAULT_DIAL_CODE,
        );
        return {
          countryCode: itemCountryCode,
          phone: formatPhone(onlyDigits(item?.phone), itemCountryCode),
          isPrimary: index === 0,
        };
      })
      .slice(0, maxPhones);

    if (!rows.length) {
      rows.push({
        countryCode,
        phone: formatPhone(onlyDigits(phone), countryCode),
        isPrimary: true,
      });
    } else {
      rows[0] = {
        countryCode,
        phone: formatPhone(onlyDigits(phone), countryCode),
        isPrimary: true,
      };
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
  const [districts, setDistricts] = useState([]);
  const [countryMenuPosition, setCountryMenuPosition] = useState(null);
  const [codeMenuPosition, setCodeMenuPosition] = useState(null);
  const [codeMenuAnchor, setCodeMenuAnchor] = useState(null);
  const countryButtonRef = useRef(null);
  const countryMenuRef = useRef(null);
  const codeMenuRef = useRef(null);

  useEffect(() => {
    if (!showCountryDropdown) return undefined;

    const updateCountryMenuPosition = () => {
      const button = countryButtonRef.current;
      if (!button) return;

      setCountryMenuPosition(
        getFloatingMenuPosition(button, button.getBoundingClientRect().width),
      );
    };

    const closeOnOutsideClick = (event) => {
      if (
        !countryButtonRef.current?.contains(event.target) &&
        !countryMenuRef.current?.contains(event.target)
      ) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }
    };

    updateCountryMenuPosition();
    window.addEventListener("resize", updateCountryMenuPosition);
    window.addEventListener("scroll", updateCountryMenuPosition, true);
    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("resize", updateCountryMenuPosition);
      window.removeEventListener("scroll", updateCountryMenuPosition, true);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [showCountryDropdown]);

  useEffect(() => {
    const menuOpen = showCodeDropdown || openAdditionalCodeIndex !== null;
    if (!menuOpen || !codeMenuAnchor) {
      setCodeMenuPosition(null);
      return undefined;
    }

    const updateCodeMenuPosition = () =>
      setCodeMenuPosition(getFloatingMenuPosition(codeMenuAnchor, 310));
    const closeOnOutsideClick = (event) => {
      if (
        !codeMenuAnchor.contains(event.target) &&
        !codeMenuRef.current?.contains(event.target)
      ) {
        setShowCodeDropdown(false);
        setOpenAdditionalCodeIndex(null);
        setCodeSearch("");
        setAdditionalCodeSearch("");
      }
    };

    updateCodeMenuPosition();
    window.addEventListener("resize", updateCodeMenuPosition);
    window.addEventListener("scroll", updateCodeMenuPosition, true);
    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("resize", updateCodeMenuPosition);
      window.removeEventListener("scroll", updateCodeMenuPosition, true);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [codeMenuAnchor, openAdditionalCodeIndex, showCodeDropdown]);

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

  useEffect(() => {
    let active = true;
    if (!selectedCountryIso || !selectedStateIso) {
      setDistricts([]);
      return () => {
        active = false;
      };
    }

    // The global city dataset is several megabytes. Load it only when a user
    // actually chooses a state instead of blocking every form's first render.
    import("country-state-city/lib/city.js").then(({ default: City }) => {
      if (active) {
        setDistricts(City.getCitiesOfState(selectedCountryIso, selectedStateIso));
      }
    });

    return () => {
      active = false;
    };
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
              onClick={(event) => {
                setShowCodeDropdown((prev) => !prev);
                setCodeMenuAnchor(event.currentTarget);
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

            {showCodeDropdown && codeMenuPosition && typeof document !== "undefined" ? createPortal(
              <div
                ref={codeMenuRef}
                className="phone-location-code-menu phone-location-code-menu--portal"
                style={codeMenuPosition}
              >
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
              </div>,
              document.body,
            ) : null}
          </div>

          <input
            value={normalizedPhones[0]?.phone || ""}
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
                  onClick={(event) => {
                    setOpenAdditionalCodeIndex((current) =>
                      current === index ? null : index
                    );
                    setCodeMenuAnchor(event.currentTarget);
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

                {openAdditionalCodeIndex === index && codeMenuPosition && typeof document !== "undefined" ? createPortal(
                  <div
                    ref={codeMenuRef}
                    className="phone-location-code-menu phone-location-code-menu--portal"
                    style={codeMenuPosition}
                  >
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
                  </div>,
                  document.body,
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
              ref={countryButtonRef}
              type="button"
              className="phone-location-country-button"
              aria-label="Choose country"
              aria-expanded={showCountryDropdown}
              onClick={() => {
                setShowCountryDropdown((prev) => !prev);
                setShowCodeDropdown(false);
                setOpenAdditionalCodeIndex(null);
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

            {showCountryDropdown && countryMenuPosition && typeof document !== "undefined" ? createPortal(
              <div
                ref={countryMenuRef}
                className="phone-location-country-menu"
                style={{
                  top: countryMenuPosition.top,
                  left: countryMenuPosition.left,
                  width: countryMenuPosition.width,
                  maxHeight: countryMenuPosition.maxHeight,
                }}
              >
                <div className="phone-location-country-search">
                  <input
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                  />
                </div>

                <div className="phone-location-country-options" style={{ maxHeight: Math.max(120, countryMenuPosition.maxHeight - 64) }}>
                  {filteredCountries.map((item) => (
                    <button
                      type="button"
                      key={item.isoCode}
                      onClick={() => handleCountrySelect(item)}
                      className={item.isoCode === selectedCountryIso ? "is-selected" : ""}
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
              </div>,
              document.body,
            ) : null}
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

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Award,
  Building2,
  Check,
  Dumbbell,
  Globe2,
  Image as ImageIcon,
  Info,
  MapPin,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import SocialLinksField from "../../components/common/SocialLinksField.jsx";
import { academyApi } from "../../api/academyApi.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import AcademyProfileActions from "./components/AcademyProfileActions.jsx";
import AcademyProfileCardHeader from "./components/AcademyProfileCardHeader.jsx";
import AcademyProfileNav from "./components/AcademyProfileNav.jsx";
import AcademyProfileState from "./components/AcademyProfileState.jsx";
import {
  CREDENTIAL_TYPES,
  MARTIAL_ART_OPTIONS,
  PROFILE_SECTIONS,
} from "./academyProfile.config.js";
import "./AcademyProfile.module.css";

const InstagramIcon = ({ size = 18, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="18" x="3" y="3" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

const createEmptyCredential = (type = "affiliation") => ({
  type,
  organizationName: "",
  registrationNumber: "",
});

const DEFAULT_CREDENTIALS = CREDENTIAL_TYPES.map(createEmptyCredential);

const normalizeCredentials = (value) => {
  const current = Array.isArray(value) ? value : [];
  const normalized = current.map((item) => ({
    type: CREDENTIAL_TYPES.includes(item?.type) ? item.type : "affiliation",
    organizationName: item?.organizationName || "",
    registrationNumber: item?.registrationNumber || "",
  }));

  CREDENTIAL_TYPES.forEach((type) => {
    if (!normalized.some((item) => item.type === type)) {
      normalized.push(createEmptyCredential(type));
    }
  });

  return normalized;
};

const normalizePhoneNumbers = (value, academyData = {}) => {
  const parsed = Array.isArray(value) ? value : [];
  const normalized = parsed
    .map((item, index) => ({
      countryCode: String(item?.countryCode || "+91").trim() || "+91",
      phone: String(item?.phone || "").trim(),
      isPrimary: index === 0,
    }))
    .slice(0, 4);

  if (!normalized.length) {
    normalized.push({
      countryCode: academyData?.countryCode || "+91",
      phone: academyData?.phone || "",
      isPrimary: true,
    });
  }

  return normalized;
};

const normalizeMartialArts = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeMartialArts(item))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) return [];

    // JSON string: '["Taekwondo", "Karate"]'
    if (
      (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) ||
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
    ) {
      try {
        return normalizeMartialArts(JSON.parse(trimmedValue));
      } catch {
        // Invalid JSON होने पर नीचे normal comma parsing चलेगी।
      }
    }

    return trimmedValue
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
  phoneNumbers: normalizePhoneNumbers(academyData?.phoneNumbers, academyData),
  affiliations: normalizeCredentials(academyData?.affiliations),
  socialLinks: {
    website: academyData?.socialLinks?.website || "",
    instagram: academyData?.socialLinks?.instagram || "",
    facebook: academyData?.socialLinks?.facebook || "",
    youtube: academyData?.socialLinks?.youtube || "",
  },
});

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value ?? "").trim());
};

const getCustomSportsStorageKey = (academyId) =>
  `khiladi-academy-custom-sports:${academyId || "current"}`;

const readStoredCustomSports = (academyId) => {
  try {
    return normalizeMartialArts(
      JSON.parse(localStorage.getItem(getCustomSportsStorageKey(academyId)) || "[]")
    );
  } catch {
    return [];
  }
};

const AcademyProfile = () => {
  const [academy, setAcademy] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customSport, setCustomSport] = useState("");
  const [customMartialArts, setCustomMartialArts] = useState([]);

  const currentYear = new Date().getFullYear();

  const loadAcademy = async () => {
    try {
      setLoading(true);

      const response = await academyApi.getMyAcademy();
      const academyData = response.data?.data?.academy || null;

      const normalizedAcademy = academyData
        ? normalizeAcademyData(academyData)
        : null;

      setAcademy(normalizedAcademy);

      if (normalizedAcademy) {
        const selectedCustomSports = normalizeMartialArts(
          normalizedAcademy.martialArts
        ).filter(
          (selectedItem) =>
            !MARTIAL_ART_OPTIONS.some(
              (option) => option.toLowerCase() === selectedItem.toLowerCase()
            )
        );

        const storedCustomSports = readStoredCustomSports(
          normalizedAcademy._id
        );

        setCustomMartialArts((previous) =>
          [...previous, ...storedCustomSports, ...selectedCustomSports].filter(
            (item, index, items) =>
              items.findIndex(
                (candidate) =>
                  candidate.toLowerCase() === item.toLowerCase()
              ) === index
          )
        );
      }

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

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!academy?._id) return;

    try {
      localStorage.setItem(
        getCustomSportsStorageKey(academy._id),
        JSON.stringify(customMartialArts)
      );
    } catch {
      // Storage unavailable होने पर current page state फिर भी काम करेगी।
    }
  }, [academy?._id, customMartialArts]);

  const selectedMartialArts = useMemo(
    () => normalizeMartialArts(academy?.martialArts),
    [academy?.martialArts]
  );

  const profileCompletion = useMemo(() => {
    if (!academy) return 0;

    const values = [
      academy.logo || logoPreview,
      academy.ownerName,
      academy.academyName,
      academy.email,
      academy.since,
      academy.phone,
      academy.country,
      academy.state,
      academy.city,
      academy.address,
      academy.about,
      selectedMartialArts,
      academy.affiliations?.some(
        (item) => item.organizationName || item.registrationNumber
      ),
      Object.values(academy.socialLinks || {}).some(Boolean),
    ];

    return Math.round(
      (values.filter((value) =>
        typeof value === "boolean" ? value : hasValue(value)
      ).length /
        values.length) *
        100
    );
  }, [academy, logoPreview, selectedMartialArts]);

  const updateField = (field, value) => {
    setAcademy((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateSocialLink = (field, value) => {
    setAcademy((previous) => ({
      ...previous,
      socialLinks: {
        ...(previous.socialLinks || {}),
        [field]: value,
      },
    }));
  };

  const toggleMartialArt = (item) => {
    setAcademy((previous) => {
      const current = normalizeMartialArts(previous.martialArts);
      const exists = current.includes(item);
      const next = exists
        ? current.filter((value) => value !== item)
        : [...current, item];

      return {
        ...previous,
        martialArts: next,
      };
    });
  };

  const addCustomMartialArt = () => {
    const value = customSport.trim().replace(/\s+/g, " ");
    if (!value) return;

    const presetMatch = MARTIAL_ART_OPTIONS.find(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    const customMatch = customMartialArts.find(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    const existingItem = presetMatch || customMatch;

    if (existingItem) {
      const alreadySelected = selectedMartialArts.some(
        (item) => item.toLowerCase() === existingItem.toLowerCase()
      );

      if (alreadySelected) {
        toast.error(`${existingItem} is already selected`);
      } else {
        toggleMartialArt(existingItem);
      }

      setCustomSport("");
      return;
    }

    setCustomMartialArts((previous) => [...previous, value]);

    setAcademy((previous) => {
      const current = normalizeMartialArts(previous.martialArts);
      return {
        ...previous,
        martialArts: [...current, value],
      };
    });

    setCustomSport("");
  };

  const handleCustomSportKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
    addCustomMartialArt();
  };

  const updateAffiliation = (index, field, value) => {
    setAcademy((previous) => ({
      ...previous,
      affiliations: previous.affiliations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addAffiliation = () => {
    setAcademy((previous) => ({
      ...previous,
      affiliations: [
        ...(previous.affiliations || []),
        createEmptyCredential("affiliation"),
      ],
    }));
  };

  const removeAffiliation = (index) => {
    setAcademy((previous) => ({
      ...previous,
      affiliations:
        previous.affiliations.length > 1
          ? previous.affiliations.filter(
              (_, itemIndex) => itemIndex !== index
            )
          : DEFAULT_CREDENTIALS.map((item) => ({ ...item })),
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
      formData.append(
        "phoneNumbers",
        JSON.stringify(normalizePhoneNumbers(academy.phoneNumbers, academy))
      );
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

      if (logoFile) formData.append("logo", logoFile);

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

  if (loading) {
    return <AcademyProfileState loading />;
  }

  if (!academy) {
    return <AcademyProfileState loading={false} onRetry={loadAcademy} />;
  }

  return (
    <div className="academy-profile">
      <form onSubmit={handleSubmit}>
        <AcademyHeroHeader
          headingId="academy-name"
          eyebrow="Academy profile"
          academyName={academy.academyName || "Your Academy"}
          ownerName={academy.ownerName || "Owner / Director not added"}
          logoUrl={logoPreview}
          addressLabel="Academy Address"
          address={[
            academy.address,
            academy.city,
            academy.state,
            academy.country,
          ]
            .filter(Boolean)
            .join(", ")}
          summaryItems={[
            {
              type: "profile",
              value: `${profileCompletion}%`,
              label: "Profile Complete",
            },
            {
              type: "since",
              value: academy.since || "—",
              label: "Established",
            },
          ]}
        />

        <AcademyProfileNav sections={PROFILE_SECTIONS} />

        <div className="academy-profile-grid academy-profile-grid--top" id="identity">
          <section className="academy-profile-card academy-profile-logo-card">
            <AcademyProfileCardHeader eyebrow="Identity" icon={ImageIcon} title="Academy Logo" />

            <div className="academy-profile-logo-card__body">
              <label
                className="academy-profile-logo-preview"
                title="Upload or change academy logo"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Academy Logo" />
                ) : (
                  <ImageIcon aria-hidden="true" />
                )}

                <span className="academy-profile-logo-upload">
                  <Upload size={20} aria-hidden="true" />
                  <strong>Upload / Change Logo</strong>
                  <small>JPG, PNG or WEBP · Maximum 2 MB</small>
                </span>

                <input
                  className="academy-profile-logo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </section>

          <section className="academy-profile-card academy-profile-basic-card">
            <AcademyProfileCardHeader eyebrow="Identity" icon={Building2} title="Basic Information" />

            <div className="academy-profile-fields academy-profile-fields--stacked">
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
                  onChange={(event) => updateField("academyName", event.target.value)}
                  placeholder="Academy Name"
                />
              </label>

              <label>
                Since Year
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
            </div>
          </section>

          <section className="academy-profile-card academy-profile-contact-card" id="contact">
            <AcademyProfileCardHeader eyebrow="Contact" icon={MapPin} title="Phone & Location" />

            <div className="academy-profile-location-fields">
              <PhoneLocationFields
                countryCode={academy.countryCode || "+91"}
                phone={academy.phone || ""}
                phoneNumbers={normalizePhoneNumbers(academy.phoneNumbers, academy)}
                maxPhones={4}
                country={academy.country || "India"}
                state={academy.state || ""}
                city={academy.city || ""}
                phoneLabel="Phone"
                onChange={updateField}
              />

              <label className="academy-profile-contact-email">
                Email
                <input
                  type="email"
                  value={academy.email || ""}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="academy@example.com"
                />
              </label>

              <label className="academy-profile-contact-address">
                Address
                <textarea
                  value={academy.address || ""}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Enter complete academy address"
                  rows={3}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="academy-profile-card academy-profile-martial" id="martial-arts">
          <AcademyProfileCardHeader eyebrow="Training" icon={Dumbbell} title="Sports / Martial Arts" />

          <div className="academy-profile-martial__chips">
            {MARTIAL_ART_OPTIONS.map((item) => {
              const active = selectedMartialArts.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  className={active ? "is-selected" : ""}
                  aria-pressed={active}
                  onClick={() => toggleMartialArt(item)}
                >
                  {active ? <Check size={14} aria-hidden="true" /> : null}
                  {item}
                </button>
              );
            })}

            {customMartialArts.map((item) => {
              const active = selectedMartialArts.some(
                (selectedItem) =>
                  selectedItem.toLowerCase() === item.toLowerCase()
              );

              return (
                <button
                  type="button"
                  key={`custom-${item}`}
                  className={`${active ? "is-selected" : ""} is-custom`.trim()}
                  aria-pressed={active}
                  onClick={() => toggleMartialArt(item)}
                >
                  {active ? <Check size={14} aria-hidden="true" /> : null}
                  {item}
                </button>
              );
            })}

            <div className="academy-profile-custom-art">
              <Plus size={15} aria-hidden="true" />
              <input
                aria-label="Add custom sport or martial art"
                placeholder="Add custom sport / martial art"
                value={customSport}
                onChange={(event) => setCustomSport(event.target.value)}
                onKeyDown={handleCustomSportKeyDown}
              />

              {customSport.trim() ? (
                <button
                  type="button"
                  className="academy-profile-custom-art__add"
                  onClick={addCustomMartialArt}
                >
                  <Plus size={13} aria-hidden="true" />
                  Add Sport
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="academy-profile-grid academy-profile-grid--editorial academy-profile-grid--editorial-single" id="about">
          <section className="academy-profile-card academy-profile-text-card">
            <AcademyProfileCardHeader eyebrow="Story" icon={Info} title="About Academy" />
            <textarea
              value={academy.about || ""}
              onChange={(event) => updateField("about", event.target.value)}
              placeholder="Write something about your academy..."
              rows={4}
            />
            <Award className="academy-profile-text-card__watermark" aria-hidden="true" />
          </section>
        </div>

        <div className="academy-profile-grid academy-profile-grid--bottom">
          <section className="academy-profile-card academy-profile-affiliations" id="affiliations">
            <AcademyProfileCardHeader eyebrow="Credentials" icon={Award} title="Affiliation / Recognition / Registration" />

            <div className="academy-profile-affiliations__head" aria-hidden="true">
              <span>Type</span>
              <span>Organization Name</span>
              <span>Number</span>
              <span>Action</span>
            </div>

            <div className="academy-profile-affiliations__rows">
              {(academy.affiliations || DEFAULT_CREDENTIALS).map(
                (item, index) => (
                  <div className="academy-profile-affiliation-row" key={index}>
                    <label>
                      <span>Type</span>
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
                      <span>Organization Name</span>
                      <input
                        value={item.organizationName || ""}
                        onChange={(event) =>
                          updateAffiliation(index, "organizationName", event.target.value)
                        }
                        placeholder="Association / Federation / Trust"
                      />
                    </label>

                    <label>
                      <span>Number</span>
                      <input
                        value={item.registrationNumber || ""}
                        onChange={(event) =>
                          updateAffiliation(index, "registrationNumber", event.target.value)
                        }
                        placeholder="Certificate / Registration No."
                      />
                    </label>

                    <button
                      type="button"
                      className="academy-profile-affiliation-row__remove"
                      onClick={() => removeAffiliation(index)}
                      aria-label={`Remove affiliation ${index + 1}`}
                      title="Remove"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              className="academy-profile-add-row"
              onClick={addAffiliation}
            >
              <Plus size={16} aria-hidden="true" />
              Add More
            </button>
          </section>

          <section className="academy-profile-card academy-profile-social" id="social">
            <AcademyProfileCardHeader eyebrow="Online Presence" icon={Globe2} title="Website & Social Links" />

            <SocialLinksField className="academy-profile-social__fields" value={academy.socialLinks} onChange={updateSocialLink} />
          </section>
        </div>

        <AcademyProfileActions onCancel={loadAcademy} saving={saving} />
      </form>
    </div>
  );
};

export default AcademyProfile;

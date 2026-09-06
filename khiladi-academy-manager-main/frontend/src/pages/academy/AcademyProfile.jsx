import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Award,
  Globe2,
  Info,
} from "lucide-react";

import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import SocialLinksField from "../../components/common/SocialLinksField.jsx";
import { academyApi } from "../../api/academyApi.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import AcademyProfileActions from "./components/AcademyProfileActions.jsx";
import AcademyProfileCardHeader from "./components/AcademyProfileCardHeader.jsx";
import AcademyProfileNav from "./components/AcademyProfileNav.jsx";
import AcademyProfileState from "./components/AcademyProfileState.jsx";
import AcademyCredentialsField from "./components/AcademyCredentialsField.jsx";
import AcademyContactFields from "./components/AcademyContactFields.jsx";
import AcademyIdentityFields from "./components/AcademyIdentityFields.jsx";
import AcademyLogoField from "./components/AcademyLogoField.jsx";
import AcademyMartialArtsField from "./components/AcademyMartialArtsField.jsx";
import {
  CREDENTIAL_TYPES,
  DEFAULT_CREDENTIAL_TYPES,
  MARTIAL_ART_OPTIONS,
  PROFILE_SECTIONS,
} from "./academyProfile.config.js";
import "./AcademyProfile.module.css";

const createEmptyCredential = (type = "affiliation") => ({
  type,
  organizationName: "",
  registrationNumber: "",
});

const DEFAULT_CREDENTIALS = DEFAULT_CREDENTIAL_TYPES.map(createEmptyCredential);

const normalizeCredentials = (value) => {
  const current = Array.isArray(value) ? value : [];
  const normalized = current.map((item) => ({
    type: CREDENTIAL_TYPES.includes(item?.type) ? item.type : "affiliation",
    organizationName: item?.organizationName || "",
    registrationNumber: item?.registrationNumber || "",
  }));

  DEFAULT_CREDENTIAL_TYPES.forEach((type) => {
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

  const removeCustomMartialArt = (item) => {
    const normalizedItem = item.toLowerCase();
    setCustomMartialArts((previous) =>
      previous.filter((sport) => sport.toLowerCase() !== normalizedItem)
    );
    setAcademy((previous) => ({
      ...previous,
      martialArts: normalizeMartialArts(previous.martialArts).filter(
        (sport) => sport.toLowerCase() !== normalizedItem
      ),
    }));
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
          <AcademyLogoField logoPreview={logoPreview} onChange={handleLogoChange} />
          <AcademyIdentityFields academy={academy} currentYear={currentYear} onChange={updateField} />

          <AcademyContactFields academy={academy} normalizePhoneNumbers={normalizePhoneNumbers} onChange={updateField} />
        </div>

        <AcademyMartialArtsField
          customSport={customSport}
          customSports={customMartialArts}
          options={MARTIAL_ART_OPTIONS}
          selectedSports={selectedMartialArts}
          onAdd={addCustomMartialArt}
          onCustomSportChange={setCustomSport}
          onCustomSportKeyDown={handleCustomSportKeyDown}
          onRemoveCustom={removeCustomMartialArt}
          onToggle={toggleMartialArt}
        />

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
          <AcademyCredentialsField
            items={academy.affiliations || DEFAULT_CREDENTIALS}
            onAdd={addAffiliation}
            onChange={updateAffiliation}
            onRemove={removeAffiliation}
          />

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

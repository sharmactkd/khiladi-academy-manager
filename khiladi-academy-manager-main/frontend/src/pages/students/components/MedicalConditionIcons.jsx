const IconBase = ({ children, size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const AsthmaIcon = (props) => <IconBase {...props}>
  <path d="M23.8 8v15" />
  <path d="M24.2 23c-3.5-4.4-5.2-8.4-5.2-12.2" />
  <path d="M23.8 23c3.5-4.4 5.2-8.4 5.2-12.2" />
  <path d="M20.8 21.5c-2.4-1.8-4-4-5-6.7" />
  <path d="M27.2 21.5c2.4-1.8 4-4 5-6.7" />
  <path d="M20.2 20.8c-4.9 1.1-8.6 4.5-10.6 10-2 5.5-.3 9.2 4.1 9.2 5.2 0 8.8-4.2 9.2-10.4l.9-6.6" />
  <path d="M27.8 20.8c4.9 1.1 8.6 4.5 10.6 10 2 5.5.3 9.2-4.1 9.2-5.2 0-8.8-4.2-9.2-10.4l-.9-6.6" />
  <path d="M15 27.5c2.5-.1 4.4-1.2 5.8-3.3M33 27.5c-2.5-.1-4.4-1.2-5.8-3.3" />
</IconBase>;

export const DiabetesIcon = (props) => <IconBase {...props}>
  <rect x="14" y="7" width="20" height="29" rx="6" />
  <rect x="18" y="12" width="12" height="11" rx="2" />
  <path d="M21 29h6" />
  <path d="M24 36v5" />
  <circle cx="24" cy="43" r="2" />
</IconBase>;

export const HeartIssueIcon = (props) => <IconBase {...props}>
  <path d="M24 39S7 29.2 7 17.8C7 11.6 14.7 8.1 19.2 13L24 18l4.8-5C33.3 8.1 41 11.6 41 17.8c0 2.2-.6 4.4-1.8 6.5" />
  <path d="M5 27h9l3-7 5 14 4-10 3 6h14" />
</IconBase>;

export const AllergiesIcon = (props) => <IconBase {...props}>
  <path d="M24 8v12c0 4-2.3 6.7-5.8 8.2" />
  <path d="M24 20c0 4 2.3 6.7 5.8 8.2" />
  <path d="M18.2 28.2c1.7 2.2 3.6 3.3 5.8 3.3s4.1-1.1 5.8-3.3" />
  <path d="M16 35h.1M23 38h.1M31 35h.1M12 31h.1M36 31h.1" />
  <circle cx="16" cy="35" r="1.4" />
  <circle cx="23" cy="39" r="1.4" />
  <circle cx="31" cy="35" r="1.4" />
  <circle cx="11" cy="30" r="1.4" />
  <circle cx="37" cy="30" r="1.4" />
</IconBase>;

export const EpilepsyIcon = (props) => <IconBase {...props}>
  <path d="M24 11c-3.1-4.8-10-2.8-10 2.8-5.4.4-6.5 7.6-2 10.2-3.3 4.7.7 10.6 6.1 9.3 1 4.7 6 5.3 7.9 1.3" />
  <path d="M24 11c3.1-4.8 10-2.8 10 2.8 5.4.4 6.5 7.6 2 10.2 3.3 4.7-.7 10.6-6.1 9.3-1 4.7-6 5.3-7.9 1.3" />
  <path d="M24 10v27M17 15c2.2.4 3.6 1.8 4.2 4M31 15c-2.2.4-3.6 1.8-4.2 4M14 24c2.8-.4 4.9.5 6.3 2.7M34 24c-2.8-.4-4.9.5-6.3 2.7M17 32c1.7-.8 3.1-.7 4.4.2M31 32c-1.7-.8-3.1-.7-4.4.2" />
</IconBase>;

const PressureGauge = ({ low = false, ...props }) => <IconBase {...props}>
  {low ? <path d="M12 8v13M7 16l5 5 5-5" /> : null}
  <path d={low ? "M18 20c2-4 5.8-6 10-6 7.7 0 14 6.3 14 14H18c0-3 .6-5.7 2-8Z" : "M8 29c0-6.2 5-11.2 11.2-11.2 1.4-5 8.5-5.6 10.7-1.1C36.2 16.2 41 21.1 41 27c0 .7-.1 1.4-.2 2H8Z"} />
  <path d={low ? "M23 28a5 5 0 0 1 10 0" : "M23 29a5 5 0 0 1 10 0"} />
  <path d={low ? "M28 28l3-6" : "M28 29l4-5"} />
</IconBase>;

export const HighBpIcon = (props) => <PressureGauge {...props} />;
export const LowBpIcon = (props) => <PressureGauge low {...props} />;

export const JointPainIcon = (props) => <IconBase {...props}>
  <path d="M18 7c3 4 2.8 8.2-.8 12.4-2.5 2.9-2.8 6.2-.7 9.6" />
  <path d="M30 7c-3 4-2.8 8.2.8 12.4 2.5 2.9 2.8 6.2.7 9.6" />
  <path d="M16.5 29c-2.4 3.5-.9 9.3 3.7 11.8M31.5 29c2.4 3.5.9 9.3-3.7 11.8" />
  <path d="M17.2 19.4c2.4 1.8 4.7 2.2 6.8 1.1 2.1 1.1 4.4.7 6.8-1.1" />
  <path d="M16.5 29c2.6-1.8 5.1-2.1 7.5-.9 2.4-1.2 4.9-.9 7.5.9" />
  <path d="M12 22l3 2M36 22l-3 2M12 31l3-1M36 31l-3-1" />
</IconBase>;

export const PreviousInjuryIcon = (props) => <IconBase {...props}>
  <g transform="rotate(-38 24 24)">
    <rect x="8" y="16" width="32" height="16" rx="8" />
    <path d="M18 16v16M30 16v16" />
    <circle cx="22" cy="21" r="1" fill="currentColor" stroke="none" />
    <circle cx="26" cy="21" r="1" fill="currentColor" stroke="none" />
    <circle cx="22" cy="27" r="1" fill="currentColor" stroke="none" />
    <circle cx="26" cy="27" r="1" fill="currentColor" stroke="none" />
  </g>
</IconBase>;

export const OtherConditionIcon = (props) => <IconBase {...props}>
  <path d="M17 14v-3c0-2 1.6-3.5 3.5-3.5h7c1.9 0 3.5 1.5 3.5 3.5v3" />
  <rect x="6" y="14" width="36" height="27" rx="4" />
  <path d="M6 24h36" />
  <path d="M20 27h8M24 23v8" />
</IconBase>;

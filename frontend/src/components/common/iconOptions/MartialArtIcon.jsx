const normalize = (value) => String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Canvas = ({ children, label }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label} focusable="false">
    <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{children}</g>
  </svg>
);

const Uniform = ({ belt = false, protector = false }) => <>
  <path d="M16.5 9.5 24 14l7.5-4.5 5 6-4.2 5.3V38H15.7V20.8l-4.2-5.3 5-6Z" />
  <path d="m17 10 7 12 7-12M24 22v16" />
  {protector ? <><path d="M19 27h10v7H19z"/><path d="M15.7 25.5h16.6"/></> : <path d="M14.8 27h18.4"/>}
  {belt ? <><path d="M15 26h18v5H15z"/><path d="M19 31l-2 5M29 31l2 5"/></> : null}
</>;

const icons = {
  taekwondo: <Uniform protector />,
  karate: <><Uniform/><path d="m11.5 16 5.5 4M36.5 16 31 20"/></>,
  judo: <Uniform belt />,
  boxing: <><path d="M9 12c5-4 12-1.5 13.5 3l1.2 3.7c.7 2-.1 4-1.9 5.1l-2.2 1.4.7 4-9.8 3.4-1.2-3.7c-2.6-.4-4.5-2.4-5-5l-.7-3.7C3 16.8 5.1 13.5 9 12Z"/><path d="m9.3 29 11 .2M10.5 32.6l1.2 3.8 9.8-3.5-1.2-3.7M18 13.5c-3 .5-5 2.6-4.6 5.3.3 2.2 1.9 3.7 4.2 4.1"/><path d="M39 12c-5-4-12-1.5-13.5 3l-1.2 3.7c-.7 2 .1 4 1.9 5.1l2.2 1.4-.7 4 9.8 3.4 1.2-3.7c2.6-.4 4.5-2.4 5-5l.7-3.7c.6-3.4-1.5-6.7-5.4-8.2Z"/><path d="m38.7 29-11 .2M37.5 32.6l-1.2 3.8-9.8-3.5 1.2-3.7M30 13.5c3 .5 5 2.6 4.6 5.3-.3 2.2-1.9 3.7-4.2 4.1"/></>,
  kickboxing: <><path d="M8.5 17.5c4.8-5 11.4-4.5 14.8-.2l2.6 3.3-7.2 7.1-3-2.5c-4.8 1.1-8.8-1.6-9.2-5.4-.1-.9.7-1.6 2-2.3Z"/><path d="m15.7 25.2 3 2.5-4 5.1-5.2-4.2 3.7-4.6M26.5 24.5l11 6.1c2.2 1.2 3.5 3.6 3.2 6.1l-.1 1.3H26.8l-8.1-10.3M29.5 38v-5.6M34.5 38v-2.8"/></>,
  wrestling: <><circle cx="18" cy="14" r="4"/><circle cx="31" cy="17" r="4"/><path d="M12 35c1-8.1 4.3-13.4 10-15.8l7.5 5.3 7.5-.7M36.5 37c-.4-7.5-3.1-12.3-8.2-14.5L20 28l-8-1m6 10 2-9 8 9M11 37h27"/></>,
  mma: <><path d="m15 7-8 8v18l8 8h18l8-8V15l-8-8H15Z"/><path d="M17 29.5v-9c0-1.7 2.3-2.2 3-.7l.8 1.7v-4.2c0-2 2.8-2 2.8 0v4-5c0-2 2.8-2 2.8 0v5-3.7c0-2 2.8-2 2.8 0v4.8-2.1c0-1.9 2.8-1.9 2.8.1v5.1c0 6-3.2 9.5-8 9.5-3.1 0-5.4-2-7-5.5Z"/></>,
  "kung-fu": <><circle cx="24" cy="24" r="16"/><path d="M24 8c5 5.2 5 10.7 0 16s-5 10.8 0 16M24 8c-5 0-9 3.6-9 8s4 8 9 8c5 0 9 3.6 9 8s-4 8-9 8"/><circle cx="24" cy="16" r="1.8" fill="currentColor" stroke="none"/><circle cx="24" cy="32" r="1.8" fill="currentColor" stroke="none"/></>,
  wushu: <><path d="M12 36 33.5 9.5M30 9l5.2-2.5-1 5.7M11.5 36.5l-2.7 4M16.5 30.5 29 34l8.5-3.5-3.2 8.2-10.8 1.8-9.2-5.4M31.5 12.5 37 18l-5.7.6-3.8-2.5"/></>,
  "muay-thai": <><path d="M13 10.5h8v11.8c0 3-1.8 5.5-4 5.5s-4-2.5-4-5.5V10.5ZM27 10.5h8v11.8c0 3-1.8 5.5-4 5.5s-4-2.5-4-5.5V10.5Z"/><path d="M12 10.5h10V7H12v3.5ZM26 10.5h10V7H26v3.5ZM17 27.8V39M31 27.8V39M13.5 32h7M27.5 32h7M13.5 35.5h7M27.5 35.5h7"/></>,
  "brazilian-jiu-jitsu": <><Uniform belt/><path d="m20 26 4 5 4-5"/></>,
  "self-defence": <><path d="M24 5 10 10.5v10.8c0 9 5.6 16.4 14 21.2 8.4-4.8 14-12.2 14-21.2V10.5L24 5Z"/><path d="M18 30V18.5c0-1.7 2.4-2.1 3-.5l1 2.7v-6c0-2 2.8-2 2.8 0v5-3.5c0-2 2.8-2 2.8 0v4.4-2c0-2 2.8-2 2.8 0v6.1c0 5.3-2.9 8.8-7.3 8.8-2.2 0-3.9-1.2-5.1-3.5Z"/></>,
  fitness: <><path d="M5 19v10M10 15v18M38 15v18M43 19v10M10 24h28M16 19v10M32 19v10"/></>,
  yoga: <><circle cx="24" cy="10.5" r="4"/><path d="M24 15v10M24 19l-8-4M24 19l8-4M24 25c-2 5.5-6.5 8.5-13.5 9 3.7 5 8.2 6.8 13.5 3.8 5.3 3 9.8 1.2 13.5-3.8-7-.5-11.5-3.5-13.5-9ZM12 40h24"/></>,
};

icons["mixed-martial-arts"] = icons.mma;
icons.bjj = icons["brazilian-jiu-jitsu"];
icons["self-defense"] = icons["self-defence"];
icons.gym = icons.fitness;

const MartialArtIcon = ({ sport }) => (
  <Canvas label={`${sport || "Martial art"} icon`}>
    {icons[normalize(sport)] || <Uniform belt />}
  </Canvas>
);

export default MartialArtIcon;
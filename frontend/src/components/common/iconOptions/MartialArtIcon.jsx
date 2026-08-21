const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const Head = ({ cx, cy, r = 4.2 }) => <circle cx={cx} cy={cy} r={r} />;

const Limb = ({ d, width = 5.4 }) => (
  <path d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
);

const Taekwondo = () => <>
  <Head cx="18" cy="8" />
  <path d="M15 13.5c3.8-2.1 8.2-.9 10.2 2.8l4.1 7.5-8.1 4.1-5.7-8.2c-1.6-2.3-1.8-4.3-.5-6.2Z" />
  <Limb d="m20 17-8.4 5.5-6.1-1.2" width="4.8" />
  <Limb d="m23.5 17.2 8.7 1 8.4-4" width="5.2" />
  <path d="m39.2 11.2 5.7 1.2-2 5.1-4.9.5Z" />
  <Limb d="m23.2 26.5-5.8 8.3-7.5 5" width="6" />
  <path d="m5.2 39.2 6.8-2.1 2.1 4.3-8.4 3.2Z" />
  <Limb d="m27 26 5.2 8.3 4.9 3.2" width="5.8" />
</>;

const Karate = () => <>
  <Head cx="21" cy="7.5" />
  <path d="m15.5 13.2 8.4-1.9 5.8 8.1-2.5 11-12.3.2-3-9.7Z" />
  <Limb d="m15.3 17.2-7 6.2-4.2.8" width="5.2" />
  <path d="m3 21.3 4.6-.5.8 6-5.2 1.5Z" />
  <Limb d="m27.4 17.2 7.3 2.1 7.7-1.8" width="5.2" />
  <path d="m40 14.8 5.5.9-.6 5.4-5.2.4Z" />
  <path d="M14.2 27.2h14.2v5.1H14.2z" />
  <Limb d="m18.2 31-3.4 9.7" width="6" />
  <Limb d="m24.8 31 7.5 8.7" width="6" />
</>;

const Judo = () => <>
  <Head cx="15" cy="8.5" />
  <Head cx="33" cy="11" r="3.8" />
  <path d="m10.5 14.3 8-1.7 7.7 8.1-5.7 9.8-10.8-4.2Z" />
  <path d="m28.6 16 8.1.7 4.9 9.7-9.7 5.3-8-7.4Z" />
  <Limb d="m17 17.5 10 4.7 8.2-5.5" width="5.2" />
  <Limb d="m31.5 29.5 7.6 8" width="5.8" />
  <Limb d="m19 29 1.8 10.5" width="5.8" />
  <Limb d="m13 27.2-5 10.1" width="5.8" />
  <path d="M10 23h15v4.2H10zM28 25h12v4.2H28z" />
</>;

const Boxing = () => <>
  <Head cx="24" cy="8" />
  <path d="M17 13.2h11.4l4.2 11.5-4.7 8.2H17.2l-4.6-8.2Z" />
  <Limb d="m17 17-7.6 2-2.8-4.7" width="5.4" />
  <Limb d="m29 17 7-3.6 3.8 3.3" width="5.4" />
  <path d="M2.8 8.7c4.2-2.5 8 .1 8 4.1v4.7l-6.6.8C1.3 16.1.8 12.2 2.8 8.7ZM38 10.3c4.3-2.2 7.8.8 7.2 4.8l-1.1 4.4-6.5-1c-2.5-2.6-2.3-5.9.4-8.2Z" />
  <Limb d="m19.5 32-3 9" width="6.2" />
  <Limb d="m26 32 4.7 9" width="6.2" />
</>;

const Kickboxing = () => <>
  <Head cx="17" cy="8" />
  <path d="m12.5 13.5 9-1.5 6.1 9.3-6.2 7.2-10.2-4.2Z" />
  <Limb d="m14 17-6.6 1.5-3-3.2" width="5" />
  <path d="M1.8 9.5c4-1.8 7.3.8 6.8 4.6l-1 4-6-1.3C-.1 14.5.1 11.8 1.8 9.5Z" />
  <Limb d="m22 16.5 5.8-3 4 2.1" width="5" />
  <Limb d="m18.5 27-2.8 10.5" width="6" />
  <Limb d="m23 27 8.2 4.5 9.2-.1" width="6" />
  <path d="m39 28 6 2.2-1.1 5.3-5.6-1.3Z" />
</>;

const Wrestling = () => <>
  <Head cx="14" cy="10" r="3.8" />
  <Head cx="31" cy="13" r="3.8" />
  <path d="m9.5 15 9-1.6 7.8 8.2-6.4 8.7-11.6-5Z" />
  <path d="m27.4 17.3 8.7 1 5.4 8.6-8.1 6.1-10-8.1Z" />
  <Limb d="m16.5 18 10.7 5.8 8.4-5" width="5.5" />
  <Limb d="m18.7 29-8.1 8.8" width="6" />
  <Limb d="m25 28.5 8.3 9" width="6" />
  <Limb d="m34 32 8.3 5" width="6" />
</>;

const Mma = () => <>
  <path d="m15 3-12 12v18l12 12h18l12-12V15L33 3Z" fill="none" stroke="currentColor" strokeWidth="3" />
  <Head cx="23" cy="12" r="3.7" />
  <path d="m17.5 17 9-1.6 5 8-5.2 8.1-10.2-3.8Z" />
  <Limb d="m18.5 20-6.2 3-3.6-3.4" width="4.8" />
  <Limb d="m29 20 6.3-2.3 3.6 2.5" width="4.8" />
  <path d="m6.2 15.7 4.6-.7 1.5 6.1-4.5 1.3ZM36.4 15.5l4.3.9-1 6-4.4-1.1Z" />
  <Limb d="m20.2 30-3.6 8.8" width="5.4" />
  <Limb d="m25.2 30 5 8.5" width="5.4" />
</>;

const KungFu = () => <>
  <Head cx="25" cy="7" />
  <path d="m18.5 12.5 9-1.2 5.1 8.2-5.4 9.2-10.5-4.4Z" />
  <Limb d="m19 16-7.5-2.7-6 2.2" width="5" />
  <path d="m2.8 12 5.6-1.2 1 5.5-5.2 2Z" />
  <Limb d="m29 16.5 6.7 4.4 7.4-1.4" width="5" />
  <path d="m41.3 16.5 5.2 1.1-1.4 5.2-4.7.2Z" />
  <Limb d="m20.5 26-8.8 5.7-6.3 7" width="6" />
  <Limb d="m25.4 28 5.8 7.4 8.8 3" width="6" />
</>;

const Wushu = () => <>
  <Head cx="18" cy="8" />
  <path d="m12.5 13 9.2-1.4 5.5 9-6.4 8.4-10.4-4.2Z" />
  <Limb d="m14 16.5-7 4-4.2-.7" width="4.8" />
  <Limb d="m24 16.5 6.5 3.5 6.7-1.4" width="4.8" />
  <Limb d="m18 28-5.5 11" width="5.8" />
  <Limb d="m22 28 8 8 8.5 2" width="5.8" />
  <path d="m36 4 3.4 2.3L20.5 37l-2.7-1.7Z" />
  <path d="m38.2 5.5 6.5-2.4-2.1 6.5Z" />
</>;

const MuayThai = () => <>
  <Head cx="21" cy="7.5" />
  <path d="m14.8 13.3 10.7-1.4 5 9.5-6.7 7.4-10.6-5Z" />
  <Limb d="m16.5 16.8-6.2-2.2-3.8 3.2" width="5" />
  <Limb d="m27.5 16 5.8-3 3.7 3.3" width="5" />
  <path d="m4 14 4.6-2.4 3.2 5-4.2 3.4ZM34 11l4.5 1.2-.3 5.9-4.7-.6Z" />
  <Limb d="m19 27-4.5 12" width="6" />
  <Limb d="m24 27 7 4.2 1.8 7.8" width="6" />
  <path d="M29 30h6v5h-6z" />
</>;

const Bjj = () => <>
  <Head cx="13" cy="17" r="3.8" />
  <Head cx="31" cy="20" r="3.8" />
  <path d="m8.5 21.5 8.3-1.3 8 7-7.5 7.4-11.2-4.1Z" />
  <path d="m26.5 24 8.4.1 7.3 7.2-7.5 6-11.2-6.6Z" />
  <Limb d="m16 24.5 10 5.3 9-5" width="5" />
  <Limb d="m17 34-10 5" width="5.8" />
  <Limb d="m24.5 32 9.5 7" width="5.8" />
  <path d="M4 42h40v3H4z" />
</>;

const SelfDefence = () => <>
  <path d="M24 3 7 10v12c0 10.7 6.8 19 17 23 10.2-4 17-12.3 17-23V10Z" fill="none" stroke="currentColor" strokeWidth="3" />
  <Head cx="22" cy="13" r="3.5" />
  <path d="m16.5 18 9-1.3 5.2 8-5.8 8-10.2-4.4Z" />
  <Limb d="m17 21-5.2 3.8" width="4.8" />
  <Limb d="m28 21 6.5-4.7" width="4.8" />
  <path d="m32.5 12.8 5.4 1.2-1.2 5.4-5-.2Z" />
  <Limb d="m20 31-4 7" width="5.2" />
  <Limb d="m24 31 5 7" width="5.2" />
</>;

const Fitness = () => <>
  <Head cx="24" cy="8" />
  <path d="m17 13 7-2 7 2 4 13-6 6H19l-6-6Z" />
  <Limb d="M15 18 8 24" width="6" />
  <Limb d="m33 18 7 6" width="6" />
  <path d="M2 19h5v11H2zM7 21h4v7H7zM37 21h4v7h-4zM41 19h5v11h-5zM9 22.5h30v4H9z" />
  <Limb d="m20 31-4 10" width="6" />
  <Limb d="m28 31 4 10" width="6" />
</>;

const Yoga = () => <>
  <Head cx="24" cy="8" />
  <path d="M18 13h12l1.2 14.5H16.8Z" />
  <Limb d="m19 17-7 6-6-1" width="5" />
  <Limb d="m29 17 7 6 6-1" width="5" />
  <Limb d="m20 27-8 7 8 4" width="6" />
  <Limb d="m28 27 8 7-8 4" width="6" />
  <path d="M8 40h32v4H8z" />
</>;

const ICONS = {
  taekwondo: Taekwondo,
  karate: Karate,
  judo: Judo,
  boxing: Boxing,
  kickboxing: Kickboxing,
  wrestling: Wrestling,
  mma: Mma,
  "mixed-martial-arts": Mma,
  "kung-fu": KungFu,
  wushu: Wushu,
  "muay-thai": MuayThai,
  "brazilian-jiu-jitsu": Bjj,
  bjj: Bjj,
  "self-defence": SelfDefence,
  "self-defense": SelfDefence,
  fitness: Fitness,
  gym: Fitness,
  yoga: Yoga,
};

const MartialArtIcon = ({ sport }) => {
  const Icon = ICONS[normalize(sport)] || Karate;
  return (
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${sport || "Martial art"} icon`} focusable="false" fill="currentColor">
      <Icon />
    </svg>
  );
};

export default MartialArtIcon;
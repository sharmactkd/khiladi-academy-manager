import bjjIcon from "../../../assets/sport-icons/bjj.png";
import boxingIcon from "../../../assets/sport-icons/boxing.png";
import fitnessIcon from "../../../assets/sport-icons/fitness.png";
import judoIcon from "../../../assets/sport-icons/judo.png";
import karateIcon from "../../../assets/sport-icons/karate.png";
import kickboxingIcon from "../../../assets/sport-icons/kickboxing.png";
import kungFuIcon from "../../../assets/sport-icons/kungfu.png";
import mmaIcon from "../../../assets/sport-icons/mma.png";
import muayThaiIcon from "../../../assets/sport-icons/muaythai.png";
import selfDefenceIcon from "../../../assets/sport-icons/selfdefence.png";
import taekwondoIcon from "../../../assets/sport-icons/taekwondo.png";
import wrestlingIcon from "../../../assets/sport-icons/wrestling.png";
import wushuIcon from "../../../assets/sport-icons/wushu.png";
import yogaIcon from "../../../assets/sport-icons/yoga.png";

export const normalizeSportName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const SPORT_ICON_REGISTRY = Object.freeze({
  taekwondo: taekwondoIcon,
  karate: karateIcon,
  judo: judoIcon,
  boxing: boxingIcon,
  kickboxing: kickboxingIcon,
  wrestling: wrestlingIcon,
  mma: mmaIcon,
  "mixed-martial-arts": mmaIcon,
  "kung-fu": kungFuIcon,
  kungfu: kungFuIcon,
  wushu: wushuIcon,
  "muay-thai": muayThaiIcon,
  muaythai: muayThaiIcon,
  "brazilian-jiu-jitsu": bjjIcon,
  "brazilian-jiujitsu": bjjIcon,
  bjj: bjjIcon,
  "self-defence": selfDefenceIcon,
  "self-defense": selfDefenceIcon,
  selfdefence: selfDefenceIcon,
  selfdefense: selfDefenceIcon,
  fitness: fitnessIcon,
  gym: fitnessIcon,
  yoga: yogaIcon,
});

export const getSportIcon = (sport) =>
  SPORT_ICON_REGISTRY[normalizeSportName(sport)] || null;

export default SPORT_ICON_REGISTRY;

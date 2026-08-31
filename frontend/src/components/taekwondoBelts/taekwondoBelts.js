import whiteBelt from "../../assets/images/belts/01-white.png";
import yellowBelt from "../../assets/images/belts/02-yellow.png";
import greenBelt from "../../assets/images/belts/03-green.png";
import greenOneBelt from "../../assets/images/belts/04-green-one.png";
import blueBelt from "../../assets/images/belts/05-blue.png";
import blueOneBelt from "../../assets/images/belts/06-blue-one.png";
import redBelt from "../../assets/images/belts/07-red.png";
import redOneBelt from "../../assets/images/belts/08-red-one.png";
import blackBelt from "../../assets/images/belts/09-black.png";

export const TAEKWONDO_BELTS = [
  "White",
  "Yellow",
  "Green",
  "Green One",
  "Blue",
  "Blue One",
  "Red",
  "Red One",
  "Black",
];

export const TAEKWONDO_BELT_IMAGES = {
  White: whiteBelt,
  Yellow: yellowBelt,
  Green: greenBelt,
  "Green One": greenOneBelt,
  Blue: blueBelt,
  "Blue One": blueOneBelt,
  Red: redBelt,
  "Red One": redOneBelt,
  Black: blackBelt,
};

export const TAEKWONDO_BELT_OPTIONS = TAEKWONDO_BELTS.map((value) => ({
  value,
  label: value,
  image: TAEKWONDO_BELT_IMAGES[value],
}));

export const TAEKWONDO_DAN_RANKS = [
  "1st Dan",
  "2nd Dan",
  "3rd Dan",
  "4th Dan",
  "5th Dan",
  "6th Dan",
  "7th Dan",
  "8th Dan",
  "9th Dan",
  "10th Dan",
];

export const TAEKWONDO_BELT_ORDER = {
  White: 1,
  Yellow: 2,
  Green: 3,
  "Green One": 4,
  Blue: 5,
  "Blue One": 6,
  Red: 7,
  "Red One": 8,
  Black: 9,
};

export const isTaekwondoSport = (value) =>
  String(value || "").trim().toLowerCase() === "taekwondo";

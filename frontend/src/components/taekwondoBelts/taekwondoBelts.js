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
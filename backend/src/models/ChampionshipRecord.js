import mongoose from "mongoose";

export const CHAMPIONSHIP_TYPES = ["Open", "Official"];

export const OFFICIAL_CATEGORIES = [
  "Association",
  "Federation",
  "School Games",
  "University Games",
  "National Games",
];

export const CHAMPIONSHIP_LEVELS = [
  "District",
  "Regional",
  "State",
  "National",
  "International",
];

export const INTERNATIONAL_GRADINGS = [
  "G-1",
  "G-2",
  "G-4",
  "G-8",
  "G-12",
  "G-16",
  "G-20",
];

export const AGE_CATEGORIES = [
  "Sub-Junior",
  "Cadet",
  "Junior",
  "Senior",
  "Under-14",
  "Under-17",
  "Under-19",
];

export const EVENT_TYPES = ["Kyorugi", "Fresher", "Tag Team", "Poomsae"];

export const POOMSAE_TYPES = ["Individual", "Pair", "Team"];

export const RESULT_TYPES = [
  "Gold",
  "Silver",
  "Bronze",
  "Participation",
  "No Medal",
  "Disqualified",
];

export const BOUT_OUTCOME_METHODS = [
  "Won by Score",
  "Bye",
  "Point Gap",
  "Knockout",
];

const championshipRecordSchema = new mongoose.Schema(
  {
    academy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Academy",
      required: [true, "Academy is required"],
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
      index: true,
    },

    championshipName: {
      type: String,
      required: [true, "Championship name is required"],
      trim: true,
      minlength: [2, "Championship name must be at least 2 characters"],
      maxlength: [200, "Championship name cannot exceed 200 characters"],
      index: true,
    },

    championshipType: {
      type: String,
      enum: CHAMPIONSHIP_TYPES,
      default: "Open",
      index: true,
    },

    officialCategory: {
      type: String,
      enum: ["", ...OFFICIAL_CATEGORIES],
      default: "",
      index: true,
    },

    level: {
      type: String,
      enum: CHAMPIONSHIP_LEVELS,
      required: [true, "Championship level is required"],
      index: true,
    },

    grading: {
      type: String,
      enum: ["", ...INTERNATIONAL_GRADINGS],
      default: "",
      index: true,
    },

    sport: {
      type: String,
      trim: true,
      default: "Taekwondo",
      index: true,
    },

    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: [true, "Event type is required"],
      index: true,
    },

    poomsaeType: {
      type: String,
      enum: ["", ...POOMSAE_TYPES],
      default: "",
      index: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Mixed"],
      default: "Male",
      index: true,
    },

    ageCategory: {
      type: String,
      enum: AGE_CATEGORIES,
      required: [true, "Age category is required"],
      index: true,
    },

    weightCategory: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    beltCategory: {
      type: String,
      trim: true,
      default: "",
    },

    result: {
      type: String,
      enum: RESULT_TYPES,
      default: "Participation",
      index: true,
    },

    disqualificationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Disqualification reason cannot exceed 500 characters"],
    },

    ranking: {
      type: Number,
      default: null,
      min: [1, "Ranking must be positive"],
    },

    totalBouts: {
      type: Number,
      default: 0,
      min: [0, "Total bouts cannot be negative"],
    },

    bouts: {
      type: [
        {
          boutNumber: { type: Number, required: true, min: 1 },
          outcomeMethod: {
            type: String,
            required: true,
            enum: BOUT_OUTCOME_METHODS,
          },
          _id: false,
        },
      ],
      default: [],
    },

    boutsWon: {
      type: Number,
      default: 0,
      min: [0, "Bouts won cannot be negative"],
    },

    boutsLost: {
      type: Number,
      default: 0,
      min: [0, "Bouts lost cannot be negative"],
    },

    pointsScored: {
      type: Number,
      default: 0,
      min: [0, "Points scored cannot be negative"],
    },

    pointsConceded: {
      type: Number,
      default: 0,
      min: [0, "Points conceded cannot be negative"],
    },

    byeReceived: {
      type: Boolean,
      default: false,
    },

    walkoverWin: {
      type: Boolean,
      default: false,
    },

    walkoverLoss: {
      type: Boolean,
      default: false,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
      index: true,
    },

    date: {
      type: Date,
      default: null,
      index: true,
    },

    championshipYear: {
      type: Number,
      index: true,
    },

    venue: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Venue cannot exceed 300 characters"],
    },

    district: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    state: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    country: {
      type: String,
      trim: true,
      default: "India",
      index: true,
    },

    organizer: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Organizer cannot exceed 200 characters"],
    },

    association: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Association cannot exceed 200 characters"],
    },

    registrationNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Registration number cannot exceed 100 characters"],
    },

    sanctionNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Sanction number cannot exceed 100 characters"],
    },

    certificateUrl: {
      type: String,
      trim: true,
      default: "",
    },

    medalPhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    podiumPhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    matchVideoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    youtubeUrl: {
      type: String,
      trim: true,
      default: "",
    },

    newsUrl: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Remarks cannot exceed 2000 characters"],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

championshipRecordSchema.index({ academy: 1, student: 1 });
championshipRecordSchema.index({ academy: 1, date: -1 });
championshipRecordSchema.index({ academy: 1, startDate: -1 });
championshipRecordSchema.index({ academy: 1, championshipYear: -1 });
championshipRecordSchema.index({ academy: 1, result: 1 });
championshipRecordSchema.index({ academy: 1, level: 1 });
championshipRecordSchema.index({ academy: 1, eventType: 1 });
championshipRecordSchema.index({ academy: 1, isDeleted: 1 });

const normalizeNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
};

championshipRecordSchema.pre("validate", function () {
  if (this.championshipType !== "Official") {
    this.officialCategory = "";
    this.grading = "";
  }

  if (this.championshipType === "Official" && this.level !== "International") {
    this.grading = "";
  }

  if (this.eventType !== "Poomsae") {
    this.poomsaeType = "";
  }

  if (this.result !== "Disqualified") {
    this.disqualificationReason = "";
  }

  if (Array.isArray(this.bouts) && this.bouts.length) {
    this.bouts = this.bouts.map((bout, index) => ({
      boutNumber: index + 1,
      outcomeMethod: bout.outcomeMethod,
    }));
    this.totalBouts = this.bouts.length;
    this.boutsWon = this.bouts.length;
    this.boutsLost = 0;
    this.byeReceived = this.bouts.some((bout) => bout.outcomeMethod === "Bye");
  }

  if (!this.startDate && this.date) {
    this.startDate = this.date;
  }

  if (!this.endDate && this.date) {
    this.endDate = this.date;
  }

  if (!this.date && this.startDate) {
    this.date = this.startDate;
  }

  if (this.startDate) {
    this.championshipYear = new Date(this.startDate).getFullYear();
  }

  this.totalBouts = normalizeNumber(this.totalBouts, 0);
  this.boutsWon = normalizeNumber(this.boutsWon, 0);
  this.boutsLost = normalizeNumber(this.boutsLost, 0);
  this.pointsScored = normalizeNumber(this.pointsScored, 0);
  this.pointsConceded = normalizeNumber(this.pointsConceded, 0);

  if (this.ranking === "" || this.ranking === undefined) {
    this.ranking = null;
  }
});

const ChampionshipRecord = mongoose.model(
  "ChampionshipRecord",
  championshipRecordSchema
);

export default ChampionshipRecord;

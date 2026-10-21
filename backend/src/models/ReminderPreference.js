import mongoose from "mongoose";
const schema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  birthdays: { type: Boolean, default: true }, dues: { type: Boolean, default: true },
  flash: { type: Boolean, default: true }, range: { type: Number, enum: [7,15,30], default: 7 },
  inactiveBirthdays: { type: Boolean, default: true }, inactiveDues: { type: Boolean, default: false },
  birthdayTemplate: { type: String, maxlength: 500, default: "Happy Birthday, {name}! Wishing you a wonderful year ahead." },
  dueTemplate: { type: String, maxlength: 500, default: "Hello {name}, your academy fee is due on {date}. Please contact the academy to complete payment." },
  birthdayFlashDay: { type: String, default: "" }, dueFlashDay: { type: String, default: "" },
  readKeys: { type: [String], default: [] },
}, { timestamps: true });
schema.index({ academy: 1, user: 1 }, { unique: true });
export default mongoose.model("ReminderPreference", schema);

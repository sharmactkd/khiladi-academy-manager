import mongoose from "mongoose";

const webhookReceiptSchema = new mongoose.Schema(
  {
    integration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentIntegration",
      required: true,
    },
    eventId: { type: String, required: true, trim: true, maxlength: 160 },
    receivedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { versionKey: false }
);

webhookReceiptSchema.index({ integration: 1, eventId: 1 }, { unique: true });

export default mongoose.model("WebhookReceipt", webhookReceiptSchema);

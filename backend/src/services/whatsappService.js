export const sendWhatsAppMessage = async ({ to, message, metadata = {} }) => {
  if (!to || !message) {
    return {
      success: false,
      status: "skipped",
      provider: "not_configured",
      providerMessageId: "",
      errorMessage: "WhatsApp recipient or message missing",
      metadata,
    };
  }

  return {
    success: false,
    status: "skipped",
    provider: "not_configured",
    providerMessageId: "",
    errorMessage:
      "WhatsApp provider is not configured yet. This is a Phase 4 foundation log only.",
    metadata,
  };
};
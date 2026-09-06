const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const logger = {
  info: (message) => {
    console.log(formatMessage("info", message));
  },

  warn: (message) => {
    console.warn(formatMessage("warn", message));
  },

  error: (message) => {
    console.error(formatMessage("error", message));
  },

  debug: (message) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message));
    }
  },
};

export default logger;
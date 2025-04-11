// Enhanced logger with better formatting and levels
export const logger = {
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },

  // Set current log level (change this to control verbosity)
  currentLevel: 2, // INFO by default

  // Get timestamp
  timestamp() {
    return new Date().toISOString();
  },

  // Format messages
  format(level, message, ...args) {
    const ts = this.timestamp();
    let formattedMessage = `[${ts}] [${level}] ${message}`;

    if (args.length > 0) {
      // Handle objects and arrays for better formatting
      const formatArg = (arg) => {
        if (typeof arg === "object" && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      };

      formattedMessage += ` ${args.map(formatArg).join(" ")}`;
    }

    return formattedMessage;
  },

  // Log methods
  error(message, ...args) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(this.format("ERROR", message, ...args));
    }
  },

  warn(message, ...args) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(this.format("WARN", message, ...args));
    }
  },

  info(message, ...args) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(this.format("INFO", message, ...args));
    }
  },

  debug(message, ...args) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(this.format("DEBUG", message, ...args));
    }
  },

  // Set log level dynamically
  setLevel(level) {
    if (typeof level === "string") {
      const upperLevel = level.toUpperCase();
      if (this.levels[upperLevel] !== undefined) {
        this.currentLevel = this.levels[upperLevel];
        this.info(`Log level set to ${upperLevel}`);
      } else {
        this.warn(`Invalid log level: ${level}`);
      }
    } else if (typeof level === "number") {
      if (level >= 0 && level <= 3) {
        this.currentLevel = level;
        const levelName = Object.keys(this.levels).find(
          (key) => this.levels[key] === level
        );
        this.info(`Log level set to ${levelName}`);
      } else {
        this.warn(`Invalid log level number: ${level}`);
      }
    }
    return this.currentLevel;
  },

  // For grouping related logs
  group(label) {
    if (typeof console.group === "function") {
      console.group(label);
    }
  },

  groupEnd() {
    if (typeof console.groupEnd === "function") {
      console.groupEnd();
    }
  },
};

// File: logger.ts
// A simple logger for API requests and responses

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: any;
}

class Logger {
  private formatMessage(message: string, options: LogOptions = {}): string {
    const timestamp = new Date().toISOString();
    const level = options.level || LogLevel.INFO;
    const context = options.context ? `[${options.context}]` : "";
    let dataString = "";

    if (options.data) {
      try {
        if (typeof options.data === "object") {
          // Convert to string but limit size to prevent massive logs
          dataString = JSON.stringify(
            options.data,
            (key, value) => {
              // Redact sensitive information
              if (
                key === "password" ||
                key === "token" ||
                key === "authorization"
              ) {
                return "[REDACTED]";
              }
              return value;
            },
            2
          ).slice(0, 1000);

          if (dataString.length === 1000) {
            dataString += "... (truncated)";
          }
        } else {
          dataString = String(options.data);
        }
      } catch (e) {
        dataString = "[Error serializing data]";
      }
    }

    return `${timestamp} ${level.toUpperCase()} ${context} ${message} ${dataString}`;
  }

  debug(message: string, options: Omit<LogOptions, "level"> = {}): void {
    console.debug(
      this.formatMessage(message, { ...options, level: LogLevel.DEBUG })
    );
  }

  info(message: string, options: Omit<LogOptions, "level"> = {}): void {
    console.info(
      this.formatMessage(message, { ...options, level: LogLevel.INFO })
    );
  }

  warn(message: string, options: Omit<LogOptions, "level"> = {}): void {
    console.warn(
      this.formatMessage(message, { ...options, level: LogLevel.WARN })
    );
  }

  error(message: string, options: Omit<LogOptions, "level"> = {}): void {
    console.error(
      this.formatMessage(message, { ...options, level: LogLevel.ERROR })
    );
  }

  // Log HTTP request
  logRequest(req: any): void {
    this.info("Incoming request", {
      context: "HTTP",
      data: {
        method: req.method,
        path: req.path || req.url,
        query: req.query,
        headers: {
          "user-agent": req.headers["user-agent"],
          "content-type": req.headers["content-type"],
        },
      },
    });
  }

  // Log GraphQL operation
  logGraphQLOperation(operation: string, variables: any): void {
    this.info(`GraphQL ${operation}`, {
      context: "GraphQL",
      data: {
        operation,
        variables: variables ? { ...variables } : undefined,
      },
    });
  }
}

// Export a singleton instance
export const logger = new Logger();

/**
 * Logger utility pour production
 * Gère les logs avec différents niveaux
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  private prefix: string;

  constructor(context: string) {
    this.prefix = context;
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.prefix,
    };
  }

  private output(entry: LogEntry) {
    // En développement: utiliser console
    if (isDevelopment) {
      const emoji = {
        info: '✅',
        warn: '⚠️',
        error: '❌',
        debug: '🔍',
      }[entry.level];

      console[entry.level === 'debug' ? 'log' : entry.level](
        `${emoji} [${entry.context}] ${entry.message}`,
        entry.data ? entry.data : ''
      );
      return;
    }

    // En production: envoyer à un service (Sentry, LogRocket, etc.)
    if (isProduction) {
      // TODO: Intégrer avec Sentry ou autre service
      // Pour maintenant, on log quand même
      if (entry.level === 'error') {
        console.error(JSON.stringify(entry));
      } else if (entry.level === 'warn') {
        console.warn(JSON.stringify(entry));
      }
    }
  }

  info(message: string, data?: any) {
    this.output(this.formatLog('info', message, data));
  }

  warn(message: string, data?: any) {
    this.output(this.formatLog('warn', message, data));
  }

  error(message: string, data?: any) {
    this.output(this.formatLog('error', message, data));
  }

  debug(message: string, data?: any) {
    if (isDevelopment) {
      this.output(this.formatLog('debug', message, data));
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export default Logger;

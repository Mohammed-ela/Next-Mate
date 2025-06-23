// Système de logs conditionnel optimisé pour NextMate
interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Configuration logs par environnement
const LOG_CONFIG = {
  PRODUCTION: {
    level: LOG_LEVELS.ERROR,
    enableConsole: false,
    enablePersistence: true,
  },
  DEVELOPMENT: {
    level: LOG_LEVELS.DEBUG,
    enableConsole: true,
    enablePersistence: false,
  },
};

// Détection environnement
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const currentConfig = isDev ? LOG_CONFIG.DEVELOPMENT : LOG_CONFIG.PRODUCTION;

class Logger {
  private static instance: Logger;
  private logBuffer: string[] = [];
  private readonly maxBufferSize = 100;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: number): boolean {
    return level <= currentConfig.level;
  }

  private formatMessage(level: string, category: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    const baseMessage = `[${timestamp}] ${level} [${category}] ${message}`;
    
    if (data && typeof data === 'object') {
      return `${baseMessage} ${JSON.stringify(data)}`;
    }
    return data ? `${baseMessage} ${data}` : baseMessage;
  }

  private addToBuffer(logMessage: string) {
    if (currentConfig.enablePersistence) {
      this.logBuffer.push(logMessage);
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer.shift();
      }
    }
  }

  error(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    
    const logMessage = this.formatMessage('❌ ERROR', category, message, data);
    this.addToBuffer(logMessage);
    
    if (currentConfig.enableConsole) {
      console.error(logMessage);
    }
  }

  warn(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    
    const logMessage = this.formatMessage('⚠️ WARN', category, message, data);
    this.addToBuffer(logMessage);
    
    if (currentConfig.enableConsole) {
      console.warn(logMessage);
    }
  }

  info(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    
    const logMessage = this.formatMessage('ℹ️ INFO', category, message, data);
    this.addToBuffer(logMessage);
    
    if (currentConfig.enableConsole) {
      console.log(logMessage);
    }
  }

  debug(category: string, message: string, data?: any) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    
    const logMessage = this.formatMessage('🐛 DEBUG', category, message, data);
    this.addToBuffer(logMessage);
    
    if (currentConfig.enableConsole) {
      console.log(logMessage);
    }
  }

  // Logs spécialisés pour NextMate
  firebase(action: string, collection: string, result?: 'success' | 'error', data?: any) {
    const emoji = result === 'success' ? '✅' : result === 'error' ? '❌' : '🔥';
    this.info('Firebase', `${emoji} ${action} [${collection}]`, data);
  }

  performance(operation: string, duration: number, details?: any) {
    const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚡' : '🚀';
    this.debug('Performance', `${emoji} ${operation} (${duration}ms)`, details);
  }

  navigation(from: string, to: string) {
    this.debug('Navigation', `📱 ${from} → ${to}`);
  }

  auth(action: string, result: 'success' | 'error', details?: any) {
    const emoji = result === 'success' ? '✅' : '❌';
    this.info('Auth', `${emoji} ${action}`, details);
  }

  cache(action: 'hit' | 'miss' | 'set' | 'clear', key: string, details?: any) {
    const emoji = action === 'hit' ? '🎯' : action === 'miss' ? '❌' : action === 'set' ? '💾' : '🗑️';
    this.debug('Cache', `${emoji} ${action.toUpperCase()} [${key}]`, details);
  }

  // Récupérer les logs (pour debug ou envoi crash reports)
  getLogs(): string[] {
    return [...this.logBuffer];
  }

  // Vider le buffer
  clearLogs() {
    this.logBuffer = [];
  }

  // Exporter les logs pour debug
  exportLogs(): string {
    return this.logBuffer.join('\n');
  }
}

// Instance singleton
export const logger = Logger.getInstance();

// Helpers pour compatibilité avec ancien code
export const logError = (category: string, message: string, data?: any) => logger.error(category, message, data);
export const logWarn = (category: string, message: string, data?: any) => logger.warn(category, message, data);
export const logInfo = (category: string, message: string, data?: any) => logger.info(category, message, data);
export const logDebug = (category: string, message: string, data?: any) => logger.debug(category, message, data);

// Export par défaut
export default logger; 
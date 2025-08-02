// Debug utility for development and error tracking
export class DebugLogger {
  private static isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static enablePerformanceMonitoring = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';

  static log(message: string, ...args: any[]) {
    if (this.isDebugMode || this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  static error(message: string, error?: Error, ...args: any[]) {
    if (this.isDebugMode || this.isDevelopment) {
      console.group(`🚨 [ERROR] ${message}`);
      if (error) {
        console.error('Error object:', error);
        console.error('Stack trace:', error.stack);
      }
      if (args.length > 0) {
        console.error('Additional data:', ...args);
      }
      console.groupEnd();
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.isDebugMode || this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  static performance(label: string, fn: () => any) {
    if (!this.enablePerformanceMonitoring) {
      return fn();
    }

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    if (duration > 100) { // Log slow operations (>100ms)
      console.warn(`⏱️ [PERF] ${label} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`⏱️ [PERF] ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  static async performanceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enablePerformanceMonitoring) {
      return await fn();
    }

    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 500) { // Log slow async operations (>500ms)
        console.warn(`⏱️ [ASYNC-PERF] ${label} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`⏱️ [ASYNC-PERF] ${label} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`⏱️ [ASYNC-PERF-ERROR] ${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  static component(componentName: string, props?: any) {
    if (this.isDebugMode && process.env.NEXT_PUBLIC_LOG_SLOW_COMPONENTS === 'true') {
      console.log(`🔧 [COMPONENT] ${componentName} rendered`, props);
    }
  }

  static api(method: string, url: string, data?: any) {
    if (this.isDebugMode) {
      console.group(`🌐 [API] ${method.toUpperCase()} ${url}`);
      if (data) {
        console.log('Request data:', data);
      }
      console.groupEnd();
    }
  }

  static database(operation: string, table?: string, data?: any) {
    if (process.env.DATABASE_DEBUG === 'true') {
      console.group(`🗄️ [DB] ${operation}${table ? ` on ${table}` : ''}`);
      if (data) {
        console.log('Data:', data);
      }
      console.groupEnd();
    }
  }

  static reportError(error: Error, context?: string, additionalData?: any) {
    // Enhanced error reporting
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      additionalData,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    };

    console.error('📋 [ERROR REPORT]', errorReport);

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true') {
      // Example: Send to error reporting service
      // sendToErrorService(errorReport);
    }

    return errorReport;
  }

  static trace(message: string, ...args: any[]) {
    if (this.isDebugMode) {
      console.trace(`🔍 [TRACE] ${message}`, ...args);
    }
  }

  static group(label: string, fn: () => void) {
    if (this.isDebugMode || this.isDevelopment) {
      console.group(`📁 [GROUP] ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  }

  static time(label: string) {
    if (this.enablePerformanceMonitoring) {
      console.time(`⏱️ ${label}`);
    }
  }

  static timeEnd(label: string) {
    if (this.enablePerformanceMonitoring) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
}

// Convenience exports
export const debug = DebugLogger.log.bind(DebugLogger);
export const debugError = DebugLogger.error.bind(DebugLogger);
export const debugWarn = DebugLogger.warn.bind(DebugLogger);
export const debugPerf = DebugLogger.performance.bind(DebugLogger);
export const debugPerfAsync = DebugLogger.performanceAsync.bind(DebugLogger);
export const debugComponent = DebugLogger.component.bind(DebugLogger);
export const debugApi = DebugLogger.api.bind(DebugLogger);
export const debugDb = DebugLogger.database.bind(DebugLogger);
export const reportError = DebugLogger.reportError.bind(DebugLogger);
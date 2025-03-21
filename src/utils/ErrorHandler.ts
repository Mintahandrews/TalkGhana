/**
 * Error handling utilities for the Ghanaian language training application
 */

// Define custom error types
export class GhanaianLanguageError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "GhanaianLanguageError";
    this.code = code;
    this.details = details;
  }
}

export class DataImportError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "DATA_IMPORT_ERROR", details);
    this.name = "DataImportError";
  }
}

export class TrainingError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "TRAINING_ERROR", details);
    this.name = "TrainingError";
  }
}

export class FileSystemError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "FILE_SYSTEM_ERROR", details);
    this.name = "FileSystemError";
  }
}

export class AudioProcessingError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "AUDIO_PROCESSING_ERROR", details);
    this.name = "AudioProcessingError";
  }
}

export class TextProcessingError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "TEXT_PROCESSING_ERROR", details);
    this.name = "TextProcessingError";
  }
}

export class ModelExportError extends GhanaianLanguageError {
  constructor(message: string, details?: any) {
    super(message, "MODEL_EXPORT_ERROR", details);
    this.name = "ModelExportError";
  }
}

/**
 * Log an error with appropriate formatting and details
 * @param error Error to log
 * @param context Additional context information
 */
export function logError(error: Error, context?: any): void {
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ERROR: ${error.name}: ${error.message}`);

  if (error instanceof GhanaianLanguageError && error.details) {
    console.error("Details:", error.details);
  }

  if (context) {
    console.error("Context:", context);
  }

  console.error("Stack trace:", error.stack);
}

/**
 * Format error for display in the UI
 * @param error Error to format
 * @returns Formatted error message
 */
export function formatErrorForDisplay(error: Error): string {
  if (error instanceof GhanaianLanguageError) {
    return `${error.name}: ${error.message}`;
  }

  return `Error: ${error.message}`;
}

/**
 * Handle errors in async functions
 * @param fn Async function to execute
 * @param errorHandler Function to handle errors
 * @returns Result of the async function or undefined if an error occurred
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    } else {
      logError(error instanceof Error ? error : new Error(String(error)));
    }
    return undefined;
  }
}

/**
 * Create a safe version of a function that catches errors
 * @param fn Function to make safe
 * @param fallbackValue Value to return if an error occurs
 * @returns Safe function that won't throw errors
 */
export function createSafeFunction<T, Args extends any[]>(
  fn: (...args: Args) => T,
  fallbackValue: T
): (...args: Args) => T {
  return (...args: Args) => {
    try {
      return fn(...args);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)));
      return fallbackValue;
    }
  };
}

export default {
  GhanaianLanguageError,
  DataImportError,
  TrainingError,
  FileSystemError,
  AudioProcessingError,
  TextProcessingError,
  ModelExportError,
  logError,
  formatErrorForDisplay,
  handleAsyncError,
  createSafeFunction,
};

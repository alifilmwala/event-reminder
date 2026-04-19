/**
 * Winston logger — writes structured JSON in production, pretty-prints in dev.
 * Import this wherever you need server-side logging.
 */
import winston from 'winston';

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    isDev ? combine(colorize(), simple()) : json(),
  ),
  transports: [
    new winston.transports.Console(),
    // Add file transports in production:
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  // Don't crash on uncaught exceptions — log them
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

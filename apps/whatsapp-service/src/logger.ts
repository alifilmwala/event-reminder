/**
 * Structured logger for the WhatsApp microservice.
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
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

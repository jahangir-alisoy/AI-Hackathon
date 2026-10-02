import { ValidationError } from './errors.js';

export const requireText = (value, field, max = 10_000) => {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${field} is required`);
  if (value.length > max) throw new ValidationError(`${field} is too long`);
  return value.trim();
};

export const optionalText = (value, field, max = 10_000) => (value === undefined || value === null || value === '' ? '' : requireText(value, field, max));

export const requireOneOf = (value, allowed, field) => {
  if (!allowed.includes(value)) throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
};

export const requireIsoDate = (value, field) => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new ValidationError(`${field} must be an ISO date`);
  return new Date(value).toISOString();
};

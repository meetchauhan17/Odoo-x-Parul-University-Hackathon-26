'use strict';

/* ─────────────────────────────────────────────────────────
   PRIMITIVE VALIDATORS
   Each returns null (ok) or an error string.
───────────────────────────────────────────────────────── */
const required = (v) =>
  v === undefined || v === null || v === '' ? 'This field is required' : null;

const minLength = (n) => (v) =>
  typeof v === 'string' && v.length < n ? `Minimum ${n} characters` : null;

const maxLength = (n) => (v) =>
  typeof v === 'string' && v.length > n ? `Maximum ${n} characters` : null;

const isEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ? null
    : 'Invalid email address';

const isPositive = (v) =>
  Number(v) > 0 ? null : 'Must be greater than 0';

const isNonNegative = (v) =>
  Number(v) >= 0 ? null : 'Must be 0 or greater';

const isEnum = (...vals) => (v) =>
  vals.includes(v) ? null : `Must be one of: ${vals.join(', ')}`;

const isUUID = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    ? null
    : 'Invalid ID format';

/* ─────────────────────────────────────────────────────────
   VALIDATE MIDDLEWARE FACTORY
   Usage:
     validate({ name: [required], price: [required, isPositive] })
───────────────────────────────────────────────────────── */
function validate(rules) {
  return (req, res, next) => {
    const errors = {};
    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field];
      for (const check of checks) {
        const error = check(value);
        if (error) { errors[field] = error; break; }
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    next();
  };
}

/* ─────────────────────────────────────────────────────────
   UUID PARAM GUARD
   Usage: router.use('/:id', validateUUIDParam('id'), handler)
───────────────────────────────────────────────────────── */
function validateUUIDParam(paramName = 'id') {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!val || isUUID(val)) {
      return res.status(400).json({ error: `Invalid ${paramName} parameter` });
    }
    next();
  };
}

module.exports = {
  validate,
  validateUUIDParam,
  /* export primitives so routes can compose their own rules */
  rules: { required, minLength, maxLength, isEmail, isPositive, isNonNegative, isEnum, isUUID },
};

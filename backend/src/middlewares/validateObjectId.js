// backend/src/middlewares/validateObjectId.js
const mongoose = require('mongoose');

/**
 * Validates if a string is a valid 24-character hexadecimal MongoDB ObjectId.
 * @param {*} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Express middleware to validate MongoDB ObjectId in req.params.
 *
 * Usage:
 * - router.get('/:id', validateObjectId, handler)
 * - router.get('/:customId', validateObjectId('customId'), handler)
 *
 * Responds with HTTP 400 Bad Request if the ID is invalid,
 * preventing unhandled Mongoose CastError exceptions.
 */
function validateObjectId(paramName = 'id') {
  if (typeof paramName === 'string') {
    return (req, res, next) => {
      const value = req.params?.[paramName];
      if (value !== undefined && !isValidObjectId(value)) {
        return res.status(400).json({ message: 'Невалідний ідентифікатор' });
      }
      next();
    };
  }

  // Direct middleware usage: router.use(validateObjectId) or router.get('/:id', validateObjectId, ...)
  const req = paramName;
  const res = arguments[1];
  const next = arguments[2];
  const idValue = req?.params?.id;

  if (idValue !== undefined && !isValidObjectId(idValue)) {
    return res.status(400).json({ message: 'Невалідний ідентифікатор' });
  }

  next();
}

validateObjectId.isValidObjectId = isValidObjectId;

module.exports = validateObjectId;


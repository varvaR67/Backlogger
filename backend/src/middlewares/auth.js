const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization') || req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Немає токена авторизації, доступ заборонено' });
  }

  const parts = authHeader.trim().split(/\s+/);
  const actualToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : parts[0];

  if (!actualToken) {
    return res.status(401).json({ message: 'Неправильний формат токена' });
  }

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Токен недійсний або термін його дії закінчився' });
  }
};
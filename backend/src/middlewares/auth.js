const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Шукаємо токен у заголовках запиту
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Доступ заборонено. Токен відсутній.' });
  }

  try {
    // Токен зазвичай приходить у форматі "Bearer <сам_токен>", тому відрізаємо зайве
    const actualToken = token.replace('Bearer ', '');
    
    // Розшифровуємо токен нашим секретним ключем
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    // Записуємо ID користувача в запит і пропускаємо його далі до бази даних
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: 'Токен недійсний або прострочений.' });
  }
};
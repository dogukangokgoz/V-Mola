const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation hatası',
      errors: errors.array()
    });
  }
  next();
};

// Auth validations
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi girin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  handleValidationErrors
];

const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad en az 2, en fazla 50 karakter olmalıdır'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad en az 2, en fazla 50 karakter olmalıdır'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi girin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Departman adı en az 2, en fazla 100 karakter olmalıdır'),
  handleValidationErrors
];

// Break validations
const validateStartBreak = [
  body('breakTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli bir mola tipi seçin'),
  handleValidationErrors
];

const validateEndBreak = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notlar en fazla 500 karakter olabilir'),
  handleValidationErrors
];

// User validations
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir kullanıcı ID\'si girin'),
  handleValidationErrors
];

// Date range validations
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Başlangıç tarihi ISO 8601 formatında olmalıdır'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Bitiş tarihi ISO 8601 formatında olmalıdır'),
  handleValidationErrors
];

// Settings validations
const validateBreakSettings = [
  body('maxDailyMinutes')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Günlük maksimum mola süresi 1-480 dakika arasında olmalıdır'),
  body('minBreakDuration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Minimum mola süresi 1-60 dakika arasında olmalıdır'),
  body('maxBreakDuration')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Maksimum mola süresi 1-120 dakika arasında olmalıdır'),
  body('autoEndAfterMinutes')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('Otomatik bitirme süresi 30-480 dakika arasında olmalıdır'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validateStartBreak,
  validateEndBreak,
  validateUserId,
  validateDateRange,
  validateBreakSettings,
  handleValidationErrors
};


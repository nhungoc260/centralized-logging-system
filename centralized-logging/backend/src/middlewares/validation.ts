import { body } from 'express-validator';

export const validateLog = [
  body('service')
    .trim()
    .notEmpty()
    .withMessage('service is required')
    .isLength({ max: 100 })
    .withMessage('service must be <= 100 chars'),

  body('level')
    .notEmpty()
    .withMessage('level is required')
    .isIn(['info', 'warn', 'error', 'debug'])
    .withMessage('level must be info | warn | error | debug'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('message is required')
    .isLength({ max: 5000 })
    .withMessage('message must be <= 5000 chars'),

  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('timestamp must be a valid ISO8601 date'),
];

import Joi from "joi";

export const sendNotificationSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
  }),
  type: Joi.string().valid("email", "sms", "push").required().messages({
    "any.only": "Type must be email, sms, or push",
  }),
  category: Joi.string()
    .valid("appointment", "payment", "reminder", "prescription", "verification")
    .required()
    .messages({
      "any.only": "Category must be appointment, payment, reminder, prescription, or verification",
    }),
  recipient: Joi.string().required().messages({
    "string.empty": "Recipient (email or phone) is required",
  }),
  subject: Joi.string().optional(),
  message: Joi.string().required().messages({
    "string.empty": "Message is required",
  }),
  templateName: Joi.string().optional(),
  templateVariables: Joi.object().optional(),
});

export const sendBulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).required().messages({
    "array.base": "User IDs must be an array",
  }),
  type: Joi.string().valid("email", "sms").required().messages({
    "any.only": "Type must be email or sms",
  }),
  category: Joi.string()
    .valid("appointment", "payment", "reminder", "prescription", "verification")
    .required(),
  subject: Joi.string().optional(),
  message: Joi.string().required(),
  templateName: Joi.string().optional(),
  templateVariables: Joi.object().optional(),
});

export const notificationTemplateSchema = Joi.object({
  templateName: Joi.string().required().messages({
    "string.empty": "Template name is required",
  }),
  type: Joi.string().valid("email", "sms").required(),
  subject: Joi.string().when("type", {
    is: "email",
    then: Joi.required().messages({
      "string.empty": "Subject is required for email templates",
    }),
    otherwise: Joi.optional(),
  }),
  bodyTemplate: Joi.string().required().messages({
    "string.empty": "Body template is required",
  }),
  variables: Joi.array().items(Joi.string()).default([]),
});

export const updateTemplateSchema = Joi.object({
  templateName: Joi.string().optional(),
  subject: Joi.string().optional(),
  bodyTemplate: Joi.string().optional(),
  variables: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

export const notificationPreferenceSchema = Joi.object({
  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  appointmentNotifications: Joi.boolean().optional(),
  paymentNotifications: Joi.boolean().optional(),
  reminderNotifications: Joi.boolean().optional(),
  prescriptionNotifications: Joi.boolean().optional(),
  verificationNotifications: Joi.boolean().optional(),
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }
    req.validatedData = value;
    next();
  };
};

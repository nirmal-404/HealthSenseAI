import Joi from "joi";

export const registerValidation = {
    body: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        dateOfBirth: Joi.date().required(),
        gender: Joi.string().required().valid("male", "female", "other"),
        address: Joi.string().allow(""),
        password: Joi.string().required(),
        role: Joi.string().required().valid("patient", "doctor", "admin")
    })
}

export const loginValidation = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    })
}

export const forgotPasswordValidation = {
    body: Joi.object().keys({
        email: Joi.string().required(),
    })
}

export const resetPasswordValidation = {
    body: Joi.object().keys({
        password: Joi.string().required(),
    })
}

export const verifyEmailValidation = {
    params: Joi.object().keys({
        token: Joi.string().required(),
    })
}
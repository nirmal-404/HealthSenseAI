import Joi from "joi";

export const registerValidation = {
    body: Joi.object().keys({
        email: Joi.string().required(),
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
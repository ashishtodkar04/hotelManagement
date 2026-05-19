const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return res.status(400).json({ success: false, error: errorMessage });
    }
    next();
};

const schemas = {
    adminLogin: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),
    updateBookingStatus: Joi.object({
        bookingId: Joi.number().required(),
        status: Joi.string().valid('pending', 'confirmed', 'seated', 'completed', 'cancelled').required()
    }),
    applyDiscount: Joi.object({
        bookingId: Joi.number().required(),
        discount: Joi.number().min(0).required()
    }),
    dish: Joi.object({
        name: Joi.string().required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().required(),
        image: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        type: Joi.string().valid('veg', 'non-veg').default('veg')
    }),
    warehouse: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('grocery', 'commodity', 'utility').required(),
        quantity: Joi.number().min(0).optional(),
        unit: Joi.string().allow('', null).optional(),
        cost: Joi.number().min(0).required(),
        date: Joi.date().required(),
        added_by: Joi.string().allow('', null).optional()
    })
};

module.exports = { validate, schemas };

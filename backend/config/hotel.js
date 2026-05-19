/**
 * Hotel identity constants — sourced from .env
 * Change HOTEL_NAME in .env and everything updates automatically.
 */
const HOTEL_NAME = process.env.HOTEL_NAME;
const HOTEL_TAGLINE = process.env.HOTEL_TAGLINE;
const HOTEL_PHONE = process.env.HOTEL_PHONE;
const HOTEL_YEAR = process.env.HOTEL_YEAR;

module.exports = { HOTEL_NAME, HOTEL_TAGLINE, HOTEL_PHONE, HOTEL_YEAR };

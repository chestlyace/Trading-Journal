"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatPercentage = formatPercentage;
exports.formatDateTime = formatDateTime;
function formatCurrency(value, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}
function formatPercentage(value, locale = 'en-US', fractionDigits = 1) {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value / 100);
}
function formatDateTime(iso, locale = 'en-US', options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
}) {
    return new Intl.DateTimeFormat(locale, options).format(new Date(iso));
}
//# sourceMappingURL=formatters.js.map
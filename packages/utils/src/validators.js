"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTradeBasic = validateTradeBasic;
function validateTradeBasic(trade) {
    const errors = [];
    if (!trade.accountId) {
        errors.push({ field: 'accountId', message: 'Account is required' });
    }
    if (!trade.instrument || trade.instrument.trim().length === 0) {
        errors.push({ field: 'instrument', message: 'Instrument is required' });
    }
    if (!trade.entryPrice || trade.entryPrice <= 0) {
        errors.push({ field: 'entryPrice', message: 'Entry price must be positive' });
    }
    if (!trade.positionSize || trade.positionSize <= 0) {
        errors.push({
            field: 'positionSize',
            message: 'Position size must be positive',
        });
    }
    if (trade.exitPrice !== null && trade.exitPrice !== undefined) {
        if (trade.exitPrice <= 0) {
            errors.push({
                field: 'exitPrice',
                message: 'Exit price must be positive when provided',
            });
        }
    }
    return errors;
}
//# sourceMappingURL=validators.js.map
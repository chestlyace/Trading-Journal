"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrossPnl = calculateGrossPnl;
exports.calculateRRRatio = calculateRRRatio;
exports.calculateWinRate = calculateWinRate;
exports.calculateExpectancy = calculateExpectancy;
exports.calculateMaxDrawdown = calculateMaxDrawdown;
function calculateGrossPnl(direction, entryPrice, exitPrice, positionSize, assetClass) {
    const priceDiff = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
    // For now we keep assetClass handling simple and return raw difference * size.
    // More precise per-asset-class logic can be added later without changing the signature.
    return priceDiff * positionSize;
}
function calculateRRRatio(direction, entryPrice, stopLoss, takeProfit) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    if (risk === 0)
        return 0;
    return Number((reward / risk).toFixed(2));
}
function calculateWinRate(wins, total) {
    if (total === 0)
        return 0;
    return Number(((wins / total) * 100).toFixed(1));
}
function calculateExpectancy(winRate, avgWin, avgLoss) {
    const lossRate = 1 - winRate / 100;
    return (winRate / 100) * avgWin - lossRate * Math.abs(avgLoss);
}
function calculateMaxDrawdown(equityCurve) {
    if (!equityCurve.length)
        return 0;
    let peak = equityCurve[0];
    let maxDD = 0;
    for (const value of equityCurve) {
        if (value > peak)
            peak = value;
        const dd = ((peak - value) / peak) * 100;
        if (dd > maxDD)
            maxDD = dd;
    }
    return Number(maxDD.toFixed(2));
}
//# sourceMappingURL=calculations.js.map
export declare function calculateGrossPnl(direction: 'LONG' | 'SHORT', entryPrice: number, exitPrice: number, positionSize: number, assetClass: string): number;
export declare function calculateRRRatio(direction: 'LONG' | 'SHORT', entryPrice: number, stopLoss: number, takeProfit: number): number;
export declare function calculateWinRate(wins: number, total: number): number;
export declare function calculateExpectancy(winRate: number, avgWin: number, avgLoss: number): number;
export declare function calculateMaxDrawdown(equityCurve: number[]): number;
//# sourceMappingURL=calculations.d.ts.map
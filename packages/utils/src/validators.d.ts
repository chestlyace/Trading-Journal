import type { Trade } from '@tradge/types';
export interface ValidationError {
    field: string;
    message: string;
}
export declare function validateTradeBasic(trade: Partial<Trade>): ValidationError[];
//# sourceMappingURL=validators.d.ts.map
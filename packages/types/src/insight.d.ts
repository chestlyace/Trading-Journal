export type InsightType = 'PATTERN' | 'RISK_ALERT' | 'EMOTIONAL' | 'STRATEGY' | 'GOAL' | 'WEEKLY_SUMMARY' | 'TRADE_NOTE' | 'ANOMALY';
export interface AIInsight {
    id: string;
    userId: string;
    insightType: InsightType;
    title: string;
    body: string;
    supportingData?: Record<string, unknown>;
    isRead: boolean;
    isDismissed: boolean;
    generatedAt: string;
    expiresAt?: string | null;
}
//# sourceMappingURL=insight.d.ts.map
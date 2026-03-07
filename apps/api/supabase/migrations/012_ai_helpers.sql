-- ============================================================
-- 012_ai_helpers.sql
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_trade_summary(p_user_id UUID)
RETURNS JSON AS $$
SELECT json_build_object(
  'total_trades', COUNT(*),
  'win_rate', ROUND(
    COUNT(*) FILTER (WHERE outcome = 'WIN')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE outcome IS NOT NULL), 0) * 100,
    1
  ),
  'total_net_pnl', SUM(net_pnl),
  'avg_win', AVG(net_pnl) FILTER (WHERE outcome = 'WIN'),
  'avg_loss', AVG(net_pnl) FILTER (WHERE outcome = 'LOSS'),
  'avg_rr_ratio', ROUND(
    AVG(rr_ratio) FILTER (WHERE rr_ratio IS NOT NULL),
    2
  ),
  'total_fees', SUM(fees),
  'most_traded_instrument', (
    SELECT instrument
    FROM trades
    WHERE user_id = p_user_id
      AND is_draft = FALSE
    GROUP BY instrument
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  'avg_trade_duration_minutes', AVG(trade_duration_minutes)
)
FROM trades
WHERE user_id = p_user_id
  AND is_draft = FALSE;
$$ LANGUAGE SQL STABLE;


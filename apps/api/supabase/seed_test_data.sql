-- ============================================================
-- TEST DATA SCRIPT FOR TRADGE DASHBOARD
-- ============================================================
-- Run this in Supabase SQL Editor AFTER running all migrations.
--
-- IMPORTANT: Replace '<YOUR_USER_ID>' below with your actual
-- Supabase auth user ID. You can find it in:
-- Supabase Dashboard → Authentication → Users → click your user → copy the UUID
-- ============================================================

-- Step 0: Set your user ID here
DO $$
DECLARE
  v_user_id UUID;
  v_account_id UUID;
BEGIN
  -- ══════════════════════════════════════════════════
  -- REPLACE THIS WITH YOUR ACTUAL USER ID
  -- ══════════════════════════════════════════════════
  v_user_id := (SELECT id FROM auth.users LIMIT 1);

  -- Step 1: Ensure a user_profiles row exists
  INSERT INTO user_profiles (user_id, display_name, onboarding_done, trading_style, session_focus)
  VALUES (v_user_id, 'Test Trader', TRUE, ARRAY['Day Trader'], ARRAY['London', 'New York'])
  ON CONFLICT (user_id) DO UPDATE SET
    onboarding_done = TRUE,
    trading_style = ARRAY['Day Trader'],
    session_focus = ARRAY['London', 'New York'];

  -- Step 2: Create a trading account
  INSERT INTO trading_accounts (id, user_id, name, broker, currency, type, initial_balance)
  VALUES (
    'a0000000-0000-0000-0000-000000000001',
    v_user_id,
    'Funded Live',
    'Oanda',
    'USD',
    'LIVE',
    10000.00
  )
  ON CONFLICT (id) DO NOTHING;

  v_account_id := 'a0000000-0000-0000-0000-000000000001';

  -- Step 3: Insert sample trades (mix of wins, losses, break-even)
  -- Trade 1: WIN - BTC/USDT Long +$420.50
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000001', v_user_id, v_account_id,
    'BTC/USDT', 'CRYPTO', 'LONG',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
    67500.00, 67920.00, 1.0,
    67200.00, 68000.00,
    425.00, 4.50, 420.50,
    3.2, 'WIN', 'LONDON', 'CONFIDENT',
    FALSE, FALSE, 60
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 2: LOSS - ETH/USDT Short -$150.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000002', v_user_id, v_account_id,
    'ETH/USDT', 'CRYPTO', 'SHORT',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours',
    3800.00, 3830.00, 5.0,
    3850.00, 3750.00,
    -147.00, 3.00, -150.00,
    1.5, 'LOSS', 'NEW_YORK', 'ANXIOUS',
    FALSE, FALSE, 45
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 3: WIN - XAU/USD Long +$1,120.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000003', v_user_id, v_account_id,
    'XAU/USD', 'COMMODITIES', 'LONG',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours',
    2350.00, 2362.00, 100.0,
    2347.00, 2365.00,
    1125.00, 5.00, 1120.00,
    4.0, 'WIN', 'LONDON', 'CALM',
    FALSE, FALSE, 240
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 4: BREAK_EVEN - TSLA Short +$5.20
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000004', v_user_id, v_account_id,
    'TSLA', 'STOCKS', 'SHORT',
    NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 2 hours',
    255.00, 254.95, 100.0,
    256.00, 253.00,
    7.20, 2.00, 5.20,
    0.1, 'BREAK_EVEN', 'NEW_YORK', 'NEUTRAL',
    FALSE, FALSE, 120
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 5: WIN - NVDA Long +$890.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000005', v_user_id, v_account_id,
    'NVDA', 'STOCKS', 'LONG',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 18 hours',
    880.00, 889.50, 100.0,
    875.00, 892.00,
    895.00, 5.00, 890.00,
    2.5, 'WIN', 'NEW_YORK', 'CONFIDENT',
    FALSE, FALSE, 360
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 6: WIN - EUR/USD Long +$320.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000006', v_user_id, v_account_id,
    'EUR/USD', 'FOREX', 'LONG',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours',
    1.0850, 1.0882, 100000.0,
    1.0830, 1.0900,
    323.00, 3.00, 320.00,
    2.8, 'WIN', 'LONDON', 'CALM',
    FALSE, FALSE, 240
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 7: LOSS - GBP/JPY Short -$210.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000007', v_user_id, v_account_id,
    'GBP/JPY', 'FOREX', 'SHORT',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 20 hours',
    192.50, 192.80, 50000.0,
    193.00, 191.50,
    -207.00, 3.00, -210.00,
    1.8, 'LOSS', 'ASIAN', 'FEARFUL',
    FALSE, FALSE, 240
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 8: WIN - USD/JPY Long +$550.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000008', v_user_id, v_account_id,
    'USD/JPY', 'FOREX', 'LONG',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 18 hours',
    154.20, 154.75, 100000.0,
    153.90, 155.00,
    554.00, 4.00, 550.00,
    3.0, 'WIN', 'LONDON', 'CONFIDENT',
    FALSE, FALSE, 360
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 9: LOSS - SOL/USDT Long -$180.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000009', v_user_id, v_account_id,
    'SOL/USDT', 'CRYPTO', 'LONG',
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 20 hours',
    175.00, 173.20, 10.0,
    172.00, 180.00,
    -176.00, 4.00, -180.00,
    1.7, 'LOSS', 'NEW_YORK', 'FOMO',
    FALSE, FALSE, 240
  ) ON CONFLICT (id) DO NOTHING;

  -- Trade 10: WIN - AAPL Long +$430.00
  INSERT INTO trades (id, user_id, account_id, instrument, asset_class, direction, entry_time, exit_time, entry_price, exit_price, position_size, stop_loss, take_profit, gross_pnl, fees, net_pnl, rr_ratio, outcome, session, emotional_state, is_open, is_draft, trade_duration_minutes)
  VALUES (
    'b0000000-0000-0000-0000-000000000010', v_user_id, v_account_id,
    'AAPL', 'STOCKS', 'LONG',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 18 hours',
    228.00, 232.40, 100.0,
    226.00, 234.00,
    435.00, 5.00, 430.00,
    2.2, 'WIN', 'NEW_YORK', 'CALM',
    FALSE, FALSE, 360
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Test data inserted successfully for user %', v_user_id;
  RAISE NOTICE '📊 10 trades: 6 WINS, 3 LOSSES, 1 BREAK_EVEN';
  RAISE NOTICE '💰 Total Net P&L: +$3,195.70';
  RAISE NOTICE '📈 Win Rate: 66.7%%';
  RAISE NOTICE '🎯 Avg R:R: ~2.28';

END $$;

-- ============================================================
-- TEST DATA SCRIPT FOR TRADGE DASHBOARD (AI INSIGHTS EDITION)
-- ============================================================
-- Run this in Supabase SQL Editor AFTER running all migrations.
-- This script will insert 25 realistic trades to trigger
-- the AI Insights pattern detection engine.
-- ============================================================

DO $$
DECLARE
  v_user_id     UUID;
  v_account_id  UUID;
  v_trade_id    UUID;
  i             INT;
  v_instrument  TEXT;
  v_asset_class asset_class_type;
  v_direction   direction_type;
  v_outcome     trade_outcome_type;
  v_session     session_type;
  v_emotional   emotional_state_type;
  v_entry_price NUMERIC;
  v_exit_price  NUMERIC;
  v_net_pnl     NUMERIC;
  v_rr_ratio    NUMERIC;
  v_offset_days INT;
BEGIN
  -- 1. Grab the first user
  v_user_id := (SELECT id FROM auth.users LIMIT 1);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up in the app first.';
  END IF;

  -- 2. Ensure user context exists
  INSERT INTO user_profiles (user_id, display_name, onboarding_done, trading_style, session_focus, last_ai_analysis_trade_count)
  VALUES (v_user_id, 'AI Test Trader', TRUE, ARRAY['Day Trader'], ARRAY['London', 'New York'], 0)
  ON CONFLICT (user_id) DO UPDATE SET last_ai_analysis_trade_count = 0;

  -- 3. Ensure an account exists
  INSERT INTO trading_accounts (id, user_id, name, broker, currency, type, initial_balance)
  VALUES ('a0000000-0000-0000-0000-000000000001', v_user_id, 'AI Funded Test', 'Simulation', 'USD', 'LIVE', 10000.00)
  ON CONFLICT (id) DO NOTHING;
  v_account_id := 'a0000000-0000-0000-0000-000000000001';

  -- 4. Delete existing mock trades so we start fresh
  DELETE FROM trades WHERE user_id = v_user_id;
  DELETE FROM ai_insights WHERE user_id = v_user_id;

  -- 5. Generate 25 trades with intentionally injected "Patterns" for Gemini to pick up on:
  -- Pattern 1: EUR/USD in London is highly profitable (Calm)
  -- Pattern 2: Crypto (BTC/USDT, SOL/USDT) in Asian session is highly unprofitable (FOMO/Anxious)
  -- Pattern 3: Poor Risk/Reward ratio on losing trades (cutting winners short, letting losers run)

  FOR i IN 1..25 LOOP
    v_trade_id := gen_random_uuid();
    v_offset_days := 25 - i; -- Spread out over last 25 days
    
    -- Injecting strict patterns
    IF i % 3 = 0 THEN
      -- The Bad Crypto Trades (Asian Session FOMO)
      v_instrument := 'BTC/USDT';
      v_asset_class := 'CRYPTO';
      v_direction := 'LONG';
      v_outcome := 'LOSS';
      v_session := 'ASIAN';
      v_emotional := 'FOMO';
      v_net_pnl := -250.00 - (random() * 50); -- Big losses
      v_rr_ratio := 0.5; -- Bad RR
      v_entry_price := 65000;
      v_exit_price := 64500;
    ELSIF i % 2 = 0 THEN
      -- The Great Forex Trades (London Session Calm)
      v_instrument := 'EUR/USD';
      v_asset_class := 'FOREX';
      v_direction := 'SHORT';
      v_outcome := 'WIN';
      v_session := 'LONDON';
      v_emotional := 'CALM';
      v_net_pnl := 150.00 + (random() * 100); -- Consistent wins
      v_rr_ratio := 2.5; -- Good RR
      v_entry_price := 1.0850;
      v_exit_price := 1.0810;
    ELSE
      -- Mix of BreakEven / Small winners in NY session
      v_instrument := 'AAPL';
      v_asset_class := 'STOCKS';
      v_direction := 'LONG';
      v_outcome := CASE WHEN random() > 0.5 THEN 'WIN'::trade_outcome_type ELSE 'BREAK_EVEN'::trade_outcome_type END;
      v_session := 'NEW_YORK';
      v_emotional := 'CONFIDENT';
      v_net_pnl := CASE WHEN v_outcome = 'WIN' THEN 80.00 ELSE 10.00 END;
      v_rr_ratio := 1.2;
      v_entry_price := 175.00;
      v_exit_price := CASE WHEN v_outcome = 'WIN' THEN 178.00 ELSE 175.10 END;
    END IF;

    -- Insert the trade
    INSERT INTO trades (
      id, user_id, account_id, instrument, asset_class, direction, outcome, session, emotional_state,
      net_pnl, gross_pnl, fees, rr_ratio, entry_price, exit_price, position_size, stop_loss, take_profit,
      entry_time, exit_time, trade_duration_minutes, is_open, is_draft
    ) VALUES (
      v_trade_id, v_user_id, v_account_id, v_instrument, v_asset_class, v_direction, v_outcome, v_session, v_emotional,
      ROUND(v_net_pnl, 2), ROUND(v_net_pnl + 5, 2), 5.00, ROUND(v_rr_ratio, 2), v_entry_price, v_exit_price, 1.0, 
      (v_entry_price * 0.99), (v_entry_price * 1.02),
      NOW() - (v_offset_days || ' days')::INTERVAL, 
      NOW() - (v_offset_days || ' days')::INTERVAL + INTERVAL '2 hours',
      120, FALSE, FALSE
    );

    -- Add some strategy tags
    INSERT INTO trade_tags (trade_id, user_id, tag_type, tag_value)
    VALUES 
      (v_trade_id, v_user_id, 'STRATEGY', CASE WHEN v_asset_class = 'FOREX' THEN 'Breakout' ELSE 'Mean Reversion' END);

  END LOOP;

  RAISE NOTICE '✅ 25 highly structured AI testing trades successfully inserted!';
  RAISE NOTICE '➡️ To test AI insights, log 1 more new trade in the mobile app to trigger the >= 20 trades threshold hook, or manually hit the POST /insights/generate endpoint.';

END $$;

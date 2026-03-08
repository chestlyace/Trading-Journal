import { supabaseAdmin } from '../lib/supabase'
import type { TradingAccount } from '@tradge/types'

export interface CreateAccountInput {
    name: string
    broker?: string | null
    currency: string
    type: TradingAccount['type']
    initialBalance?: number | null
}

export class AccountService {
    static async list(userId: string): Promise<TradingAccount[]> {
        const { data, error } = await supabaseAdmin
            .from('trading_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to list accounts: ${error.message}`)
        }

        return (data ?? []) as unknown as TradingAccount[]
    }

    static async getById(userId: string, id: string): Promise<TradingAccount | null> {
        const { data, error } = await supabaseAdmin
            .from('trading_accounts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error || !data) return null
        return data as unknown as TradingAccount
    }

    static async create(userId: string, data: CreateAccountInput): Promise<TradingAccount> {
        // 1. Create the account
        const { data: account, error } = await supabaseAdmin
            .from('trading_accounts')
            .insert({
                user_id: userId,
                name: data.name,
                broker: data.broker ?? null,
                currency: data.currency,
                type: data.type,
                initial_balance: data.initialBalance ?? null,
            })
            .select()
            .single()

        if (error || !account) {
            throw new Error(`Failed to create account: ${error?.message ?? 'unknown'}`)
        }

        // 2. Mark user as onboarded in profiles table
        await supabaseAdmin
            .from('user_profiles')
            .update({ onboarding_done: true })
            .eq('user_id', userId)

        return account as unknown as TradingAccount
    }

    static async update(
        userId: string,
        id: string,
        updates: Partial<CreateAccountInput>
    ): Promise<TradingAccount> {
        const { data: account, error } = await supabaseAdmin
            .from('trading_accounts')
            .update({
                name: updates.name,
                broker: updates.broker,
                currency: updates.currency,
                type: updates.type,
                initial_balance: updates.initialBalance,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error || !account) {
            throw new Error(`Failed to update account: ${error?.message ?? 'unknown'}`)
        }

        return account as unknown as TradingAccount
    }

    static async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('trading_accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            throw new Error(`Delete failed: ${error.message}`)
        }
    }
}

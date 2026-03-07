import { Expo, ExpoPushMessage } from 'expo-server-sdk'
import { Resend } from 'resend'
import { supabaseAdmin } from '../lib/supabase'
import { env } from '../config/env'

const expo = env.EXPO_ACCESS_TOKEN
  ? new Expo({ accessToken: env.EXPO_ACCESS_TOKEN })
  : null

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export class NotificationService {
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<void> {
    if (!expo) return

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('push_token')
      .eq('user_id', userId)
      .single()

    const token = (profile as any)?.push_token
    if (!token || !Expo.isExpoPushToken(token)) return

    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: {},
    }

    const chunks = expo.chunkPushNotifications([message])
    for (const chunk of chunks) {
      // fire and forget
      await expo.sendPushNotificationsAsync(chunk)
    }
  }

  static async sendEmail(to: string, subject: string, html: string) {
    if (!resend) return
    await resend.emails.send({
      from: env.FROM_EMAIL,
      to,
      subject,
      html,
    })
  }
}


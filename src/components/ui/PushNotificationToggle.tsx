'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { urlBase64ToUint8Array } from '@/utils/vapid'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'
import { useUser } from '@/components/(base)/providers/UserProvider'

export function PushNotificationToggle() {
  const user = useUser()
  const userId = user?.id
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      // Check for both service Worker and userId
      if ('serviceWorker' in navigator && userId) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
              const subJson = JSON.parse(JSON.stringify(sub))
              
              const { data } = await supabase
                .from('push_subscriptions')
                .select('id')
                .match({ user_id: userId, endpoint: subJson.endpoint })
                .maybeSingle()

              if (data) {
                setIsSubscribed(true)
              } else {
                await sub.unsubscribe()
                setIsSubscribed(false)
              }
            }
          }
        } catch (e) {
          console.error("Error checking push status:", e)
        }
      }
    }
    checkStatus()
  }, [userId, supabase])

  const handleToggle = async () => {
    if (!userId) return
    setLoading(true)
    try {
      if (!('serviceWorker' in navigator)) return

      // Register the service worker exactly like the user's snippet
      const reg = await navigator.serviceWorker.register('/sw.js')
      await reg.update()
      
      const registration = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const subscriptionJson = JSON.parse(JSON.stringify(subscription))
          
          await supabase.from('push_subscriptions')
            .delete()
            .match({ user_id: userId, endpoint: subscriptionJson.endpoint })

          await subscription.unsubscribe()
        }
        setIsSubscribed(false)
      } else {
        const rawVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!rawVapidKey) throw new Error("VAPID public key not found")
        
        // Remove quotes if they exist
        const vapidKey = rawVapidKey.replace(/^["']|["']$/g, '')
        
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })

        const subscriptionJson = JSON.parse(JSON.stringify(sub))

        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth
        }, { onConflict: 'endpoint' })

        if (error) throw error

        setIsSubscribed(true)
      }
    } catch (error: any) {
      console.error("Push toggle error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error
      })
    } finally {
      setLoading(false)
    }
  }

  if (!userId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        borderWidth: isSubscribed ? '2px' : '1.5px',
        borderStyle: 'solid',
        backgroundColor: isSubscribed ? '#FEFCE8' : '#f3f4f6',
        borderColor: isSubscribed ? '#FEF08A' : '#e5e7eb',
      }}
      title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
    >
      {loading ? (
        <Loader2 className="animate-spin" style={{ width: '18px', height: '18px', color: '#2563EB' }} />
      ) : isSubscribed ? (
        <div style={{ position: 'relative', display: 'flex' }}>
          <Bell strokeWidth={2} style={{ width: '20px', height: '20px', color: '#EAB308', fill: '#EAB308' }} />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            backgroundColor: '#22c55e',
            border: '2px solid #ffffff',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check strokeWidth={4} style={{ width: '8px', height: '8px', color: '#ffffff' }} />
          </div>
        </div>
      ) : (
        <BellOff strokeWidth={2} style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
      )}
    </button>
  )
  
}

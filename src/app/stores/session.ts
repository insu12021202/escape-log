import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/shared/api/supabase'

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    ready.value = true

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, ready, init, signInWithGoogle, signOut }
})

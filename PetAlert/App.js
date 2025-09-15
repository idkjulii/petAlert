import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from './services/supabase'
import AuthScreen from './screens/AuthScreen'
import MapScreen from './screens/MapScreen'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const handleAuthSuccess = (user) => {
    setUser(user)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🐕❤️</Text>
        <Text style={styles.loadingText}>Iniciando PetAlert...</Text>
      </View>
    )
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <MapScreen 
      user={user} 
      onLogout={handleLogout}
    />
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
})

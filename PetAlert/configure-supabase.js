// Script para configurar Supabase con la URL de redirección personalizada
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lolrkkcuilabugfalgwj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbHJra2N1aWxhYnVnZmFsZ3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDY3ODQsImV4cCI6MjA3MzUyMjc4NH0.nILbwh54yyFeL6XOBSvC82N_bIxCEagN0jmEYEB1isU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function configureSupabase() {
  console.log('Configurando Supabase para verificación de email...')
  
  // Nota: Para configurar las URLs de redirección en Supabase, necesitas:
  // 1. Ir al panel de Supabase (https://supabase.com/dashboard)
  // 2. Seleccionar tu proyecto
  // 3. Ir a Authentication > URL Configuration
  // 4. Agregar 'petalert://auth/callback' a las URLs de redirección permitidas
  
  console.log('URLs de redirección que debes agregar en Supabase:')
  console.log('- petalert://auth/callback')
  console.log('- petalert://')
  console.log('')
  console.log('Pasos:')
  console.log('1. Ve a https://supabase.com/dashboard')
  console.log('2. Selecciona tu proyecto')
  console.log('3. Ve a Authentication > URL Configuration')
  console.log('4. En "Redirect URLs" agrega: petalert://auth/callback')
  console.log('5. En "Site URL" puedes poner: petalert://')
  console.log('6. Guarda los cambios')
  
  // Probar la configuración creando un usuario de prueba
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test2@petalert.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Usuario Test 2',
          phone: '+1234567890'
        },
        emailRedirectTo: 'petalert://auth/callback'
      }
    })
    
    if (error) {
      console.log('Error al crear usuario de prueba:', error.message)
    } else {
      console.log('Usuario de prueba creado exitosamente:', data.user?.email)
      console.log('Revisa tu email para el enlace de verificación')
    }
  } catch (err) {
    console.log('Error:', err.message)
  }
}

configureSupabase()

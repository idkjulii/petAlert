import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase
const supabaseUrl = 'https://lolrkkcuilabugfalgwj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbHJra2N1aWxhYnVnZmFsZ3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDY3ODQsImV4cCI6MjA3MzUyMjc4NH0.nILbwh54yyFeL6XOBSvC82N_bIxCEagN0jmEYEB1isU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones helper para la app móvil
export const dbHelpers = {
  // Obtener reportes activos cerca de una ubicación
  async getNearbyReports(latitude, longitude, radiusKm = 10) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        title,
        description,
        type,
        location_lat,
        location_lng,
        photos,
        reward_amount,
        created_at,
        users (full_name, phone)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) return { data: null, error }
    
    // Filtrar por distancia (implementación básica)
    const filteredData = data?.filter(report => {
      const distance = getDistanceFromLatLonInKm(
        latitude, longitude,
        report.location_lat, report.location_lng
      )
      return distance <= radiusKm
    })
    
    return { data: filteredData, error: null }
  },

  // Crear un nuevo reporte
  async createReport(reportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...reportData,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
    
    return { data, error }
  },

  // Obtener mascotas del usuario
  async getUserPets(userId) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Subir imagen a Supabase Storage
  async uploadImage(uri, bucket = 'pet-photos') {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) throw error

      // Obtener URL pública
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return { data: publicData.publicUrl, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Función para calcular distancia entre dos puntos
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c // Distancia en km
  return d
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

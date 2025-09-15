import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Image,
  ScrollView
} from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import * as Location from 'expo-location'
import { dbHelpers } from '../services/supabase'

// MapTiler API Key
const MAPTILER_API_KEY = 'O6QOJXgm20FYrlibfbgm'

const { width, height } = Dimensions.get('window')

// Configurar MapLibre
MapLibreGL.setAccessToken(null) // MapLibre no necesita token de acceso

const MapScreen = ({ user, onLogout }) => {
  const mapRef = useRef(null)
  const cameraRef = useRef(null)
  const [location, setLocation] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)

  // Estilo del mapa con MapTiler
  const mapStyle = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`

  useEffect(() => {
    getLocationPermission()
  }, [])

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de ubicación',
          'PetAlert necesita acceso a tu ubicación para mostrarte mascotas cercanas',
          [{ text: 'OK' }]
        )
        setLoading(false)
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
      
      setLocation(newLocation)
      loadNearbyReports(newLocation.latitude, newLocation.longitude)
    } catch (error) {
      console.error('Error obteniendo ubicación:', error)
      Alert.alert('Error', 'No se pudo obtener tu ubicación')
      // Ubicación por defecto (Buenos Aires)
      const defaultLocation = { latitude: -34.6037, longitude: -58.3816 }
      setLocation(defaultLocation)
      loadNearbyReports(defaultLocation.latitude, defaultLocation.longitude)
    }
  }

  const loadNearbyReports = async (lat, lng) => {
    try {
      const { data, error } = await dbHelpers.getNearbyReports(lat, lng, 10)
      
      if (error) {
        console.error('Error cargando reportes:', error)
        // Datos de prueba para testing
        const mockReports = [
          {
            id: '1',
            title: 'Perrito Golden perdido',
            description: 'Se perdió cerca del parque el domingo pasado. Es muy amigable y responde al nombre de Max.',
            type: 'lost',
            location_lat: lat + 0.002,
            location_lng: lng + 0.002,
            photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=400'],
            reward_amount: 5000,
            created_at: new Date().toISOString(),
            users: { full_name: 'María García', phone: '11-1234-5678' }
          },
          {
            id: '2',
            title: 'Gatito encontrado',
            description: 'Encontré este pequeño gatito en la calle. Está sano y busca a su familia.',
            type: 'found',
            location_lat: lat - 0.003,
            location_lng: lng + 0.001,
            photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'],
            reward_amount: null,
            created_at: new Date().toISOString(),
            users: { full_name: 'Juan Pérez', phone: '11-8765-4321' }
          },
          {
            id: '3',
            title: 'Perrita Beagle perdida',
            description: 'Luna se perdió durante el paseo matutino. Lleva collar rosa.',
            type: 'lost',
            location_lat: lat + 0.001,
            location_lng: lng - 0.002,
            photos: ['https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400'],
            reward_amount: 8000,
            created_at: new Date().toISOString(),
            users: { full_name: 'Ana López', phone: '11-5555-9999' }
          }
        ]
        setReports(mockReports)
      } else {
        setReports(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const goToMyLocation = () => {
    if (location && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [location.longitude, location.latitude],
        zoomLevel: 15,
        animationDuration: 1000,
      })
    }
  }

  const handleReportPress = (report) => {
    setSelectedReport(report)
  }

  const handleAddReport = (type) => {
    const message = type === 'lost' 
      ? 'Próximamente: Formulario para reportar mascota perdida'
      : type === 'found'
      ? 'Próximamente: Formulario para reportar mascota encontrada'
      : 'Próximamente: Sistema de reportes'
    
    Alert.alert('En desarrollo', message)
  }

  const renderReportMarkers = () => {
    return reports.map((report) => (
      <MapLibreGL.MarkerView
        key={report.id}
        coordinate={[report.location_lng, report.location_lat]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <TouchableOpacity
          style={[
            styles.markerContainer,
            { backgroundColor: report.type === 'lost' ? '#ef4444' : '#10b981' }
          ]}
          onPress={() => handleReportPress(report)}
        >
          <Text style={styles.markerEmoji}>
            {report.type === 'lost' ? '🐕' : '🏠'}
          </Text>
        </TouchableOpacity>
      </MapLibreGL.MarkerView>
    ))
  }

  const renderUserLocationMarker = () => {
    if (!location) return null

    return (
      <MapLibreGL.MarkerView
        coordinate={[location.longitude, location.latitude]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.userMarkerContainer}>
          <View style={styles.userMarkerInner}>
            <Text style={styles.userMarkerText}>Tú</Text>
          </View>
        </View>
      </MapLibreGL.MarkerView>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🐕❤️</Text>
        <Text style={styles.loadingText}>Cargando PetAlert...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Mapa MapLibre */}
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={location ? [location.longitude, location.latitude] : [-58.3816, -34.6037]}
          zoomLevel={14}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Marcador del usuario */}
        {renderUserLocationMarker()}

        {/* Marcadores de reportes */}
        {renderReportMarkers()}
      </MapLibreGL.MapView>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.headerTitle}>PetAlert</Text>
          <Text style={styles.headerSubtitle}>Encuentra a tu mascota</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reports.filter(r => r.type === 'lost').length}</Text>
          <Text style={styles.statLabel}>Perdidas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{reports.filter(r => r.type === 'found').length}</Text>
          <Text style={styles.statLabel}>Encontradas</Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.foundButton]}
          onPress={() => handleAddReport('found')}
        >
          <Text style={styles.actionButtonEmoji}>🏠</Text>
          <Text style={styles.actionButtonText}>Encontré una mascota</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.lostButton]}
          onPress={() => handleAddReport('lost')}
        >
          <Text style={styles.actionButtonEmoji}>🐕</Text>
          <Text style={styles.actionButtonText}>Perdí mi mascota</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de ubicación */}
      <TouchableOpacity style={styles.locationButton} onPress={goToMyLocation}>
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Modal de detalles del reporte */}
      <Modal
        visible={!!selectedReport}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedReport && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReport.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedReport(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedReport.photos?.[0] || 'https://via.placeholder.com/400x240/cccccc/666666?text=Sin+Imagen' }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.typeContainer}>
                <Text style={[
                  styles.typeTag,
                  selectedReport.type === 'lost' ? styles.lostTag : styles.foundTag
                ]}>
                  {selectedReport.type === 'lost' ? '🐕 Mascota Perdida' : '🏠 Mascota Encontrada'}
                </Text>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Descripción:</Text>
                <Text style={styles.descriptionText}>{selectedReport.description}</Text>
              </View>

              {selectedReport.reward_amount && (
                <View style={styles.rewardContainer}>
                  <Text style={styles.rewardTitle}>💰 Recompensa:</Text>
                  <Text style={styles.rewardAmount}>
                    ${selectedReport.reward_amount.toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={styles.contactContainer}>
                <Text style={styles.contactTitle}>Contacto:</Text>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {selectedReport.users?.full_name || 'Usuario'}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {selectedReport.users?.phone || 'Teléfono no disponible'}
                  </Text>
                </View>
              </View>

              <Text style={styles.dateText}>
                Reportado: {new Date(selectedReport.created_at).toLocaleDateString('es-AR')}
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Alert.alert('Próximamente', 'Sistema de mensajería en desarrollo')}
              >
                <Text style={styles.contactButtonText}>Contactar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
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
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  logoContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  foundButton: {
    backgroundColor: '#10b981',
  },
  lostButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationButton: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  locationButtonText: {
    fontSize: 20,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerEmoji: {
    fontSize: 16,
  },
  userMarkerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userMarkerInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  lostTag: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  foundTag: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  rewardContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  contactContainer: {
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#3b82f6',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  contactButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default MapScreen
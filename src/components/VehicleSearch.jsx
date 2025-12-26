import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { motion } from "framer-motion"

export default function VehicleSearch() {
  const router = useRouter()
  // On s'assure que l'URL ne finit pas par un slash pour éviter les doubles //
  const BACKEND_URL = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  // États de données
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [years, setYears] = useState([])

  // États de sélection
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")

  // Headers communs (INDISPENSABLE pour Medusa v2)
  const headers = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': API_KEY
  }

  // 1. Charger les MARQUES
  // Route : /store/vehicle-options?type=brand
  useEffect(() => {
    fetch(`${BACKEND_URL}/store/vehicle-options?type=brand`, { headers })
      .then((res) => res.json())
      .then((data) => {
        // Le backend renvoie { options: ["Peugeot", "Renault"] }
        if (data && Array.isArray(data.options)) setBrands(data.options)
      })
      .catch((err) => console.error("Error loading brands:", err))
  }, []) // Exécuté une seule fois au montage

  // 2. Charger les MODÈLES
  // Route : /store/vehicle-options?type=model&brand=XXX
  useEffect(() => {
    if (!selectedBrand) {
      setModels([])
      return
    }
    
    // Reset des sélections suivantes
    setModels([])
    setYears([])
    setSelectedModel("")
    setSelectedYear("")

    const url = `${BACKEND_URL}/store/vehicle-options?type=model&brand=${encodeURIComponent(selectedBrand)}`
    
    fetch(url, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.options)) setModels(data.options)
      })
      .catch((err) => console.error("Error loading models:", err))
  }, [selectedBrand])

  // 3. Charger les ANNÉES
  // Route : /store/vehicle-options?type=year&brand=XXX&model=YYY
  useEffect(() => {
    if (!selectedBrand || !selectedModel) {
      setYears([])
      return
    }

    setYears([])
    setSelectedYear("")

    const url = `${BACKEND_URL}/store/vehicle-options?type=year&brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`

    fetch(url, { headers })
      .then((res) => res.json())
      .then((data) => {
        // Filtrer les nulls et trier
        if (data && Array.isArray(data.options)) {
          const validYears = data.options.filter(y => y != null).sort().reverse()
          setYears(validYears)
        }
      })
      .catch((err) => console.error("Error loading years:", err))
  }, [selectedModel, selectedBrand])

  // Action Recherche
  const handleSearch = () => {
    if (selectedBrand && selectedModel) {
      // On redirige vers la page de résultats
      // Note: Assure-toi que ta page /search utilise aussi la nouvelle API
      let query = `/search?brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`
      if (selectedYear) query += `&year=${selectedYear}`
      
      router.push(query)
    }
  }

  // Styles
  const selectStyle = {
    padding: '12px',
    borderRadius: '5px',
    border: 'none',
    flex: 1,
    minWidth: '120px',
    backgroundColor: '#fff',
    color: '#000',
    cursor: 'pointer'
  }

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)',
        marginTop: '40px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '900px',
        width: '100%'
      }}
    >
      {/* 1. SELECT MARQUE */}
      <select 
        style={selectStyle}
        value={selectedBrand}
        onChange={(e) => setSelectedBrand(e.target.value)}
      >
        <option value="">Marque</option>
        {brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
      </select>

      {/* 2. SELECT MODELE */}
      <select 
        style={{...selectStyle, opacity: selectedBrand ? 1 : 0.6}}
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        disabled={!selectedBrand}
      >
        <option value="">Modèle</option>
        {models.map((m, i) => <option key={i} value={m}>{m}</option>)}
      </select>

      {/* 3. SELECT ANNEE */}
      <select 
        style={{...selectStyle, opacity: selectedModel ? 1 : 0.6}}
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        disabled={!selectedModel || years.length === 0}
      >
        <option value="">Année</option>
        {years.map((y, i) => (
          <option key={i} value={y}>{y}</option>
        ))}
      </select>

      {/* BOUTON RECHERCHE */}
      <button 
        onClick={handleSearch}
        disabled={!selectedBrand || !selectedModel}
        style={{ 
          padding: '12px 30px', 
          background: selectedBrand && selectedModel ? '#D90429' : '#555', 
          color: 'white', 
          border: 'none', 
          fontWeight: 'bold', 
          borderRadius: '5px', 
          cursor: selectedBrand && selectedModel ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase',
          transition: '0.3s'
        }}
      >
        Check Fitment
      </button>
    </motion.div>
  )
}
export const products = [
  // 1. MOTEUR
  {
    id: '101',
    name: 'Kit Distribution Renforcé',
    price: 120,
    category: 'Moteur',
    subCategory: 'Distribution',
    image: '/images/turbo.jpg', // Utilise turbo comme placeholder moteur
    description: 'Kit complet incluant courroie, galets et pompe à eau haute performance.',
    specs: 'Compatible moteurs TDI/HDi, Durée de vie +50%'
  },
  {
    id: '102',
    name: 'Turbo Hybride X500',
    price: 850,
    category: 'Moteur',
    subCategory: 'Alimentation',
    image: '/images/turbo.jpg',
    description: 'Augmentez la puissance avec ce turbo hybride plug-and-play.',
    specs: 'Palier céramique, Wastegate renforcée'
  },

  // 2. FILTRATION
  {
    id: '201',
    name: 'Huile Synthétique 5W30 (5L)',
    price: 45,
    category: 'Filtration & Fluides',
    subCategory: 'Huiles',
    image: '/images/hero-bg.jpg', // Placeholder
    description: 'Huile moteur haute performance pour protection maximale.',
    specs: 'Norme LongLife, Anti-friction'
  },

  // 3. FREINAGE
  {
    id: '301',
    name: 'Disques Ventilés Sport',
    price: 180,
    category: 'Freinage',
    subCategory: 'Frein Avant',
    image: '/images/brakes.jpg',
    description: 'Disques rainurés et percés pour un refroidissement optimal.',
    specs: 'Diamètre 340mm, Acier carbone'
  },
  {
    id: '302',
    name: 'Plaquettes Céramique',
    price: 90,
    category: 'Freinage',
    subCategory: 'Frein Avant',
    image: '/images/brakes.jpg',
    description: 'Freinage mordant sans poussière noire.',
    specs: 'Coefficient friction GG, Usage routier/sport'
  },

  // 4. TRANSMISSION
  {
    id: '401',
    name: 'Kit Embrayage Stage 2',
    price: 450,
    category: 'Transmission',
    subCategory: 'Embrayage',
    image: '/images/suspension.jpg', // Placeholder mécanique
    description: 'Supporte plus de couple, idéal pour reprogrammation.',
    specs: 'Disque organique renforcé, Volant moteur inclus'
  },

  // 5. SUSPENSION
  {
    id: '501',
    name: 'Amortisseurs Réglables (Coilovers)',
    price: 750,
    category: 'Suspension',
    subCategory: 'Amortissement',
    image: '/images/suspension.jpg',
    description: 'Abaissez votre véhicule et améliorez la tenue de route.',
    specs: 'Réglage hauteur et dureté (32 clics)'
  },

  // 6. DIRECTION
  {
    id: '601',
    name: 'Crémaillère Assistée Électrique',
    price: 600,
    category: 'Direction',
    subCategory: 'Système',
    image: '/images/suspension.jpg', // Placeholder
    description: 'Direction précise et réactive remise à neuf.',
    specs: 'Garantie 2 ans, Calibrage usine'
  },

  // 7. ÉLECTRICITÉ
  {
    id: '701',
    name: 'Batterie AGM Start&Stop',
    price: 180,
    category: 'Électricité',
    subCategory: 'Démarrage',
    image: '/images/turbo.jpg', // Placeholder technique
    description: 'Puissance de démarrage fiable par grand froid.',
    specs: '70Ah, 760A, Technologie AGM'
  },
  {
    id: '702',
    name: 'Kit Phares LED Matrix',
    price: 120,
    category: 'Électricité',
    subCategory: 'Éclairage',
    image: '/images/hero-bg.jpg',
    description: 'Conversion LED haute puissance 6000K.',
    specs: 'Canbus sans erreur, 12000 Lumens'
  },

  // 8. ÉCHAPPEMENT
  {
    id: '801',
    name: 'Ligne Inox Cat-Back',
    price: 900,
    category: 'Échappement',
    subCategory: 'Ligne',
    image: '/images/hero-bg.jpg',
    description: 'Sonorité sportive et gain de poids.',
    specs: 'Inox 304L, Soudures TIG'
  },

  // 9. CLIMATISATION (CVC)
  {
    id: '901',
    name: 'Compresseur de Clim A/C',
    price: 350,
    category: 'Climatisation',
    subCategory: 'Climatisation',
    image: '/images/turbo.jpg',
    description: 'Pièce de remplacement OEM de haute qualité.',
    specs: 'Pré-huilé, Poulie incluse'
  },

  // 10. CARROSSERIE
  {
    id: '1001',
    name: 'Rétroviseur Carbone M',
    price: 150,
    category: 'Carrosserie',
    subCategory: 'Carrosserie',
    image: '/images/hero-bg.jpg',
    description: 'Coques de rétroviseurs style M en fibre de carbone véritable.',
    specs: 'Finition vernis brillant, Montage clips'
  }
];

export const categories = [
  { name: 'Moteur', image: '/images/engine.jpg', desc: 'Distribution, Turbo, Alimentation' },
  { name: 'Filtration & Fluides', image: '/images/filtration.jpg', desc: 'Huiles, Filtres Air/Huile' },
  { name: 'Freinage', image: '/images/brakes.jpg', desc: 'Disques, Plaquettes, ABS' },
  { name: 'Transmission', image: '/images/transmission.jpg', desc: 'Embrayage, Boîte, Cardan' },
  { name: 'Suspension', image: '/images/suspension.jpg', desc: 'Amortisseurs, Roulements' },
  { name: 'Direction', image: '/images/steering.jpg', desc: 'Crémaillère, Rotules' },
  { name: 'Électricité', image: '/images/lighting.jpg', desc: 'Batterie, Éclairage, Capteurs' },
  { name: 'Échappement', image: '/images/exhaust.jpg', desc: 'Silencieux, Catalyseur, FAP' },
  { name: 'Climatisation', image: '/images/hvac.jpg', desc: 'Compresseur, Chauffage' },
  { name: 'Carrosserie', image: '/images/body.jpg', desc: 'Pare-chocs, Rétros, Intérieur' }
];
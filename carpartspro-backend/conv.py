import pandas as pd
from slugify import slugify

# --- CONFIGURATION ---
SOURCE_FILE = 'products_with_images.csv'  # Ton fichier avec Référence;Produit...
OUTPUT_FILE = 'import_medusa.csv' # Le fichier qui sera créé
REGION_ID = 'reg_01KCYBHF3PV0D5HHW1NM4RXBQ0'
CURRENCY = 'mad'
STOCK_DEFAULT = 100
STATUS_DEFAULT = 'published'

def generate_description(row):
    """Génère une description basée sur le produit et le type de voiture."""
    produit = row.get('Produit', '')
    voiture = row.get('Type Voiture', '')
    cat = row.get('Sous-Catégorie', '')
    
    desc = f"<p>Découvrez notre <strong>{produit}</strong>, une pièce de qualité spécialement adaptée pour les véhicules de type <strong>{voiture}</strong>.</p>"
    desc += f"<p>Idéal pour la maintenance ou la réparation dans la catégorie {cat}. Profitez de notre meilleur tarif en {CURRENCY.upper()}.</p>"
    return desc

def process_csv():
    try:
        # 1. Lecture du fichier source
        # Note : On utilise sep=';' car ton header suggère ce séparateur
        df_source = pd.read_csv(SOURCE_FILE, sep=';', encoding='utf-8')
        print(f"Fichier source chargé : {len(df_source)} produits trouvés.")

    except FileNotFoundError:
        print("Erreur : Le fichier 'source.csv' est introuvable.")
        return
    except Exception as e:
        print(f"Erreur lors de la lecture : {e}")
        return

    # 2. Création de la liste des données pour Medusa
    medusa_data = []

    for index, row in df_source.iterrows():
        # Nettoyage et préparation des variables
        title = str(row['Produit']).strip()
        reference = str(row['Référence']).strip()
        type_voiture = str(row['Type Voiture']).strip()
        price_raw = row['prix']
        
        # Gestion du prix (Medusa stocke souvent en centimes, mais l'import CSV accepte les décimaux souvent)
        # Ici on s'assure que c'est un float
        try:
            # On remplace la virgule par un point si nécessaire
            price_float = float(str(price_raw).replace(',', '.'))
        except:
            price_float = 0.0

        # Génération du Handle (URL friendly)
        handle = slugify(title)

        # Construction de la ligne
        new_row = {
            'title': title,
            'handle': handle,
            'status': STATUS_DEFAULT,
            'description': generate_description(row),
            'subtitle': type_voiture,
            'thumbnail': row['Image URL'],
            # Pour les catégories, on combine ou on met la principale. 
            # Note: Medusa attend souvent des IDs, mais on met les noms pour l'instant (Format: Parent/Enfant)
            'categories': f"{row['Catégorie Principale']}/{row['Sous-Catégorie']}", 
            'type_id': '', # Laisser vide ou mapper si tu as des IDs de types
            'collection_id': '',
            'tags': f"{type_voiture},{row['Catégorie Principale']}", # Tags séparés par virgule
            'variant_title': 'Default', # Standard pour produit simple
            'variant_sku': reference,
            'variant_price_amount': price_float,
            'variant_price_currency': CURRENCY,
            'variant_price_region_id': REGION_ID,
            'variant_manage_inventory': True, # Requis pour gérer le stock
            'variant_inventory_quantity': STOCK_DEFAULT,
            'metadata_seo_title': title,
            'metadata_seo_description': f"Achetez {title} pour {type_voiture} au meilleur prix."
        }
        medusa_data.append(new_row)

    # 3. Création du DataFrame final
    df_medusa = pd.DataFrame(medusa_data)

    # Ordre des colonnes (pour correspondre exactement à ta demande)
    columns_order = [
        'title', 'handle', 'status', 'description', 'subtitle', 'thumbnail', 
        'categories', 'type_id', 'collection_id', 'tags', 'variant_title', 
        'variant_sku', 'variant_price_amount', 'variant_price_currency', 
        'variant_price_region_id', 'variant_manage_inventory', 
        'variant_inventory_quantity', 'metadata_seo_title', 'metadata_seo_description'
    ]
    
    # Réorganisation (et ajout des colonnes manquantes si besoin)
    df_medusa = df_medusa.reindex(columns=columns_order)

    # 4. Export
    df_medusa.to_csv(OUTPUT_FILE, index=False, sep=',', encoding='utf-8')
    print(f"Succès ! Fichier '{OUTPUT_FILE}' généré avec {len(df_medusa)} lignes.")

if __name__ == "__main__":
    process_csv()
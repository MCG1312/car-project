import pandas as pd
from tqdm import tqdm

# --- CONFIGURATION (Tu peux enrichir cette liste !) ---
# Structure: (mot_clé, "Catégorie Principale", "Sous-Catégorie")
# L'ordre est important : les plus spécifiques en premier.
KEYWORD_MAP = [
    # Freinage
    ('frein', 'Freinage', 'Général'),
    ('plaquette', 'Freinage', 'Plaquettes'),
    ('disque', 'Freinage', 'Disques'),
    ('étrier', 'Freinage', 'Étriers'),
    ('flexible de frein', 'Freinage', 'Flexibles'),
    
    # Suspension & Direction
    ('amortisseur', 'Suspension & Direction', 'Amortisseurs'),
    ('suspension', 'Suspension & Direction', 'Supports & Silentblocs'),
    ('biellette', 'Suspension & Direction', 'Biellettes'),
    ('rotule', 'Suspension & Direction', 'Rotules'),
    ('direction', 'Suspension & Direction', 'Crémaillères & Direction'),
    ('crémaillère', 'Suspension & Direction', 'Crémaillères & Direction'),
    ('triangle', 'Suspension & Direction', 'Bras & Triangles'),
    ('train', 'Suspension & Direction', 'Trains Roulants'),
    ('essieu', 'Suspension & Direction', 'Trains Roulants'),
    ('moyeu', 'Suspension & Direction', 'Moyeux & Roulements'),
    ('roulement', 'Suspension & Direction', 'Moyeux & Roulements'),
    ('soufflet direction', 'Suspension & Direction', 'Soufflets'),
    ('palier', 'Suspension & Direction', 'Paliers & Barres Stabilisatrices'),
    
    # Moteur
    ('moteur', 'Moteur', 'Supports Moteur'),
    ('culbuteur', 'Moteur', 'Culasse & Distribution'),
    ('culasse', 'Moteur', 'Culasse & Distribution'),
    ('poussoir', 'Moteur', 'Culasse & Distribution'),
    ('distribution', 'Moteur', 'Culasse & Distribution'),
    ('courroie', 'Moteur', 'Courroies & Galets'),
    ('galet-tendeur', 'Moteur', 'Courroies & Galets'),
    ('pompe à eau', 'Moteur', 'Refroidissement'),
    ('thermostat', 'Moteur', 'Refroidissement'),
    ('radiateur', 'Moteur', 'Refroidissement'),
    ('durite', 'Moteur', 'Refroidissement'),
    ('pompe à huile', 'Moteur', 'Lubrification'),
    ('filtre à huile', 'Moteur', 'Filtration'),
    ('filtre à air', 'Moteur', 'Filtration'),
    ('vidange', 'Moteur', 'Lubrification'),
    ('bougie', 'Moteur', 'Allumage'),
    
    # Transmission
    ('embrayage', 'Transmission', 'Embrayage'),
    ('cardan', 'Transmission', 'Cardans & Soufflets'),
    ('soufflet de cardan', 'Transmission', 'Cardans & Soufflets'),
    ('boite à vitesses', 'Transmission', 'Boîte de vitesses'),
    ('changement de vitesse', 'Transmission', 'Boîte de vitesses'),
    ('différentiel', 'Transmission', 'Boîte de vitesses'),
    
    # Échappement
    ('échappement', 'Échappement', 'Général'),
    ('silencieux', 'Échappement', 'Silencieux'),
    
    # Électrique
    ('démarreur', 'Électrique', 'Démarreurs'),
    ('alternateur', 'Électrique', 'Alternateurs'),
    ('batterie', 'Électrique', 'Batteries'),
    ('poulie', 'Électrique', 'Poulies & Accessoires'),
]

def categorize_product(product_name):
    """Analyse le nom du produit et retourne une paire (Catégorie, Sous-catégorie)."""
    if not isinstance(product_name, str):
        return ('Pièces Diverses', '')
        
    lower_name = product_name.lower()
    
    for keyword, main_cat, sub_cat in KEYWORD_MAP:
        if keyword in lower_name:
            return (main_cat, sub_cat)
            
    # Si aucun mot-clé n'est trouvé, on met une catégorie par défaut
    return ('Pièces Diverses', '')

# --- SCRIPT PRINCIPAL ---
if __name__ == "__main__":
    INPUT_FILE = 'products.csv'
    OUTPUT_FILE = 'products_categorized.csv'

    print(f"📖 Lecture du fichier '{INPUT_FILE}'...")
    try:
        df = pd.read_csv(INPUT_FILE, sep=';', encoding='utf-8')
    except FileNotFoundError:
        print(f"❌ ERREUR : Fichier '{INPUT_FILE}' introuvable.")
        exit()

    print("🤖 Catégorisation automatique en cours...")
    
    # Appliquer la fonction de catégorisation à chaque ligne
    # tqdm ajoute une belle barre de progression
    tqdm.pandas(desc="Processing products")
    categories = df['Produit'].progress_apply(categorize_product)
    
    # Créer les nouvelles colonnes à partir des résultats
    df['Catégorie Principale'] = [cat[0] for cat in categories]
    df['Sous-Catégorie'] = [cat[1] for cat in categories]

    # Réorganiser les colonnes pour une meilleure lisibilité
    cols = ['Référence', 'Produit', 'Type Voiture', 'prix', 'Catégorie Principale', 'Sous-Catégorie']
    df = df[cols]

    print(f"\n💾 Sauvegarde dans '{OUTPUT_FILE}'...")
    df.to_csv(OUTPUT_FILE, sep=';', index=False, encoding='utf-8-sig')

    print(f"\n🎉 TERMINÉ ! Le fichier '{OUTPUT_FILE}' est prêt.")


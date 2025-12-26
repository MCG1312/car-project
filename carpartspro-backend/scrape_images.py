import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import random
from tqdm import tqdm

# --- CONFIGURATION ---
# Le script lira ce fichier (qui doit contenir les catégories)
INPUT_FILE = 'products.csv' 
# Il créera ce nouveau fichier avec la colonne "Image URL" en plus
OUTPUT_FILE = 'products_with_images.csv'

# On simule un navigateur pour ne pas être bloqué
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def scrape_image_url(product_name, car_type):
    """Cherche sur Google Images et retourne l'URL de la première image pertinente."""
    if not isinstance(car_type, str):
        car_type = ""
    
    # On nettoie le "Type Voiture" pour une meilleure recherche (ex: "P.205/P.309" -> "P 205 P 309")
    clean_car_type = car_type.replace('.', ' ').replace('/', ' ')
    
    query = f"{product_name} {clean_car_type}"
    search_url = f"https://www.google.com/search?tbm=isch&q={requests.utils.quote(query)}"
    
    try:
        response = requests.get(search_url, headers=HEADERS)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # On parcourt les images pour trouver la première URL valide
        all_images = soup.find_all('img')
        for img in all_images:
            src = img.get('src')
            if src and (src.startswith('https://encrypted-tbn0.gstatic.com') or src.startswith('data:image')):
                return src

        return "NOT_FOUND" # Si aucune image n'est trouvée
    except Exception:
        # En cas d'erreur réseau, on marque comme non trouvé
        return "NOT_FOUND"

# --- SCRIPT PRINCIPAL ---
if __name__ == "__main__":
    print(f"📖 Lecture du fichier '{INPUT_FILE}'...")
    try:
        df = pd.read_csv(INPUT_FILE, sep=';', encoding='utf-8')
    except FileNotFoundError:
        print(f"❌ ERREUR : Fichier '{INPUT_FILE}' introuvable. Assure-toi qu'il a bien les colonnes de catégories.")
        exit()

    # On ajoute la nouvelle colonne si elle n'existe pas
    if 'Image URL' not in df.columns:
        df['Image URL'] = ''

    print(f"🚀 Démarrage du scraping pour {len(df)} produits. Cela va prendre environ 40 minutes...")

    # tqdm ajoute une belle barre de progression
    for index, row in tqdm(df.iterrows(), total=df.shape[0], desc="Scraping Images"):
        # On ne scrape que si la case est vide
        if pd.isna(row['Image URL']) or row['Image URL'] == '':
            product_name = row['Produit']
            car_type = row['Type Voiture']
            
            image_url = scrape_image_url(product_name, car_type)
            df.at[index, 'Image URL'] = image_url

            # Pause aléatoire pour simuler un humain (très important !)
            time.sleep(random.uniform(1.5, 3.0))

    print(f"\n💾 Sauvegarde des résultats dans '{OUTPUT_FILE}'...")
    df.to_csv(OUTPUT_FILE, sep=';', index=False, encoding='utf-8-sig')

    print("\n🎉 TERMINÉ ! Le fichier CSV avec les URLs des images est prêt.")
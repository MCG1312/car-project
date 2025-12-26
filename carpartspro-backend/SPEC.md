## 3. API Options de Véhicules (Dropdowns)
Crée une nouvelle route API : `src/api/store/vehicle-options/route.ts`.
Cette route sert à remplir les menus déroulants du Frontend.

**Logique GET :**
1. Récupérer tous les produits publiés.
2. Parcourir leurs `metadata.compatibility.vehicles`.
3. Extraire les valeurs uniques pour construire une liste hiérarchique ou plate.

**Paramètres (Query) :**
- `?type=brand` -> Retourne la liste des marques uniques (ex: ["Renault", "Peugeot"]).
- `?type=model&brand=Renault` -> Retourne les modèles uniques pour cette marque (ex: ["Clio IV", "Megane"]).
- `?type=year&brand=Renault&model=Clio IV` -> Retourne les années disponibles.

**Format de réponse attendu :**
```json
{
  "options": ["Renault", "Peugeot", "Dacia"]
}
Contraintes :
Utilise la même logique simple que vehicle-search (pas de class-validator).
Gère les doublons (Set ou filter).
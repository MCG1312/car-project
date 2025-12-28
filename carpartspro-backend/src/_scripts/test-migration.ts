import { DataSource } from "typeorm"
import { config } from "dotenv"

// Charger les variables d'environnement
config()

async function testMigration() {
  let dataSource: DataSource | null = null
  
  try {
    console.log("Testing migration...")
    
    // Configuration de la connexion à la base de données
    dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/medusa-db",
      schema: "public",
      logging: true,
      entities: ["src/models/*.ts"],
      migrations: ["src/migrations/*.ts"],
    })
    
    // Initialiser la connexion
    await dataSource.initialize()
    console.log("✅ Connected to database")
    
    // Vérifier si la colonne existe
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product' AND column_name = 'reference_oem';
    `
    
    const result = await dataSource.query(query)
    
    if (result && result.length > 0) {
      console.log("✅ Migration successful: 'reference_oem' column exists in 'product' table")
    } else {
      console.log("❌ Migration failed: 'reference_oem' column does not exist in 'product' table")
    }
    
  } catch (error) {
    console.error("❌ Error testing migration:", error)
    process.exit(1)
    
  } finally {
    // Fermer la connexion si elle est ouverte
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy()
      console.log("✅ Database connection closed")
    }
    process.exit(0)
  }
}

// Exécuter le test
testMigration()

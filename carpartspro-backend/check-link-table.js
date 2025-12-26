const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'carpartspro'
});

async function checkLinkTable() {
  try {
    await client.connect();
    console.log('✅ Connecté\n');

    // Structure complète de product_variant_price_set
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'product_variant_price_set'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Structure de product_variant_price_set:');
    console.table(cols.rows);

    // Exemple de données existantes
    const example = await client.query(`
      SELECT * FROM product_variant_price_set LIMIT 1;
    `);
    
    console.log('\n📊 Exemple de données:');
    console.log(example.rows[0]);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkLinkTable();
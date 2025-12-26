const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'carpartspro'
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // 1. Structure de price_set
    console.log('📋 Structure de price_set:');
    const priceSetCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price_set' 
      ORDER BY ordinal_position;
    `);
    console.table(priceSetCols.rows);

    // 2. Structure de price
    console.log('\n📋 Structure de price:');
    const priceCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'price' 
      ORDER BY ordinal_position;
    `);
    console.table(priceCols.rows);

    // 3. Tables de liaison (link tables)
    console.log('\n📋 Tables contenant "price" dans leur nom:');
    const priceTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%price%' 
      AND table_schema = 'public'
      ORDER BY table_name;
    `);
    console.table(priceTables.rows);

    // 4. Vérifier la table product_variant
    console.log('\n📋 Structure de product_variant (colonnes liées aux prix):');
    const variantCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_variant' 
      AND column_name LIKE '%price%'
      ORDER BY ordinal_position;
    `);
    console.table(variantCols.rows);

    // 5. Exemple de données
    console.log('\n📊 Exemple de variant avec ses relations:');
    const example = await client.query(`
      SELECT 
        pv.id as variant_id,
        pv.title as variant_title,
        p.title as product_title
      FROM product_variant pv
      JOIN product p ON pv.product_id = p.id
      LIMIT 1;
    `);
    console.log(example.rows[0]);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'carpartspro'
});

async function updatePricesFromCSV() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // 1. Lire le fichier CSV
    console.log('📂 Lecture du fichier CSV...');
    const csvContent = fs.readFileSync('products.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Ignorer la première ligne (en-têtes)
    const dataLines = lines.slice(1);
    console.log(`📊 ${dataLines.length} produits trouvés dans le CSV\n`);

    // 2. Trouver la région Maroc
    const regionResult = await client.query(`
      SELECT id, currency_code 
      FROM region 
      WHERE name ILIKE '%maroc%' 
      LIMIT 1;
    `);

    if (regionResult.rows.length === 0) {
      console.log('❌ Région Maroc introuvable');
      return;
    }

    const region = regionResult.rows[0];
    console.log('✅ Région Maroc:', region.id);
    console.log('   Devise:', region.currency_code, '\n');

    // 3. Parcourir chaque ligne du CSV
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    console.log('🔄 Mise à jour des prix...\n');

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      // Parser la ligne CSV (séparateur point-virgule)
      const parts = line.split(';');
      if (parts.length < 4) {
        console.log(`⚠️  Ligne ${i + 2} ignorée: format incorrect`);
        continue;
      }

      const reference = parts[0].trim();
      const productName = parts[1].trim();
      const priceStr = parts[3].trim().replace(',', '.');
      const price = Math.round(parseFloat(priceStr) );

      if (isNaN(price)) {
        console.log(`⚠️  ${reference}: Prix invalide (${parts[3]})`);
        errors++;
        continue;
      }

      try {
        // Chercher le produit par référence (SKU)
        const productResult = await client.query(`
          SELECT 
            p.id as product_id,
            p.title as product_title,
            pv.id as variant_id,
            pvps.price_set_id
          FROM product p
          JOIN product_variant pv ON pv.product_id = p.id
          LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
          WHERE p.external_id = $1 OR pv.sku = $1
          AND p.deleted_at IS NULL
          AND pv.deleted_at IS NULL
          LIMIT 1;
        `, [reference]);

        if (productResult.rows.length === 0) {
          console.log(`❌ ${reference}: Produit non trouvé`);
          notFound++;
          continue;
        }

        const product = productResult.rows[0];

        if (!product.price_set_id) {
          console.log(`⚠️  ${reference}: Pas de price_set (utilisez d'abord fix-prices-correct.js)`);
          errors++;
          continue;
        }

        // Mettre à jour le prix existant ou en créer un nouveau
        const updateResult = await client.query(`
          UPDATE price 
          SET amount = $1, 
              raw_amount = $2,
              updated_at = NOW()
          WHERE price_set_id = $3 
          AND currency_code = $4
          RETURNING id;
        `, [
          price,
          JSON.stringify({ value: price.toFixed(2) }),
          product.price_set_id,
          region.currency_code
        ]);

        if (updateResult.rows.length > 0) {
          updated++;
          if (updated % 50 === 0) {
            console.log(`   ✓ ${updated}/${dataLines.length} prix mis à jour...`);
          }
        } else {
          // Si pas de prix existant, en créer un
          const priceId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await client.query(`
            INSERT INTO price (
              id, 
              price_set_id, 
              currency_code, 
              amount, 
              raw_amount,
              rules_count,
              created_at, 
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW());
          `, [
            priceId,
            product.price_set_id,
            region.currency_code,
            price,
            JSON.stringify({ value: price.toFixed(2) })
          ]);
          updated++;
        }

      } catch (error) {
        console.log(`❌ ${reference}: Erreur - ${error.message}`);
        errors++;
      }
    }

    console.log('\n✅ Mise à jour terminée !');
    console.log('\n📊 Résumé:');
    console.log(`   ✅ Prix mis à jour: ${updated}`);
    console.log(`   ❌ Produits non trouvés: ${notFound}`);
    console.log(`   ⚠️  Erreurs: ${errors}`);
    console.log(`   📋 Total traité: ${dataLines.length}`);

    if (notFound > 0) {
      console.log('\n💡 Conseil: Les produits non trouvés utilisent probablement');
      console.log('   une référence différente. Vérifiez le champ "external_id"');
      console.log('   ou "sku" dans votre base de données.');
    }

  } catch (error) {
    console.error('\n❌ Erreur globale:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n👋 Connexion fermée');
  }
}

updatePricesFromCSV();
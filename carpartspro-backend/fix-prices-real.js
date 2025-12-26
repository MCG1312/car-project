const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'carpartspro'
});

// Parser CSV simple
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index];
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function fixPricesWithRealValues() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Lire le CSV
    console.log('\n📄 Lecture du CSV...');
    const csvPath = 'import_medusa.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Fichier import_medusa.csv introuvable !');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvData = parseCSV(csvContent);
    
    console.log(`✅ ${csvData.length} lignes lues`);

    // 2. Créer un mapping SKU → Prix (en centimes)
    const skuToPriceMap = new Map();
    
    for (const row of csvData) {
      const sku = row['variant_sku']?.trim();
      const priceStr = row['variant_price_amount']?.trim();
      
      if (sku && priceStr) {
        const priceInMAD = parseFloat(priceStr);
        const priceInCentimes = Math.round(priceInMAD * 100);
        
        if (priceInCentimes > 0) {
          skuToPriceMap.set(sku, priceInCentimes);
        }
      }
    }
    
    console.log(`✅ ${skuToPriceMap.size} prix trouvés dans le CSV`);
    console.log(`   Exemple: SKU "${Array.from(skuToPriceMap.keys())[0]}" = ${Array.from(skuToPriceMap.values())[0]} centimes`);

    // 3. Trouver la région Maroc
    const regionResult = await client.query(`
      SELECT id, name, currency_code 
      FROM region 
      WHERE currency_code = 'mad'
      LIMIT 1;
    `);

    if (regionResult.rows.length === 0) {
      console.log('❌ Région MAD introuvable');
      return;
    }

    const region = regionResult.rows[0];
    console.log('\n✅ Région trouvée:', region.name);
    console.log('   ID:', region.id);

    // 4. Trouver tous les variants
    console.log('\n🔍 Analyse des variants...');
    const variantsResult = await client.query(`
      SELECT 
        pv.id as variant_id,
        pv.sku,
        pv.title,
        ps.id as price_set_id,
        pr.id as price_id,
        pr.amount as current_amount
      FROM product_variant pv
      LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      LEFT JOIN price_set ps ON pvps.price_set_id = ps.id
      LEFT JOIN price pr ON ps.id = pr.price_set_id AND pr.currency_code = 'mad'
      WHERE pv.deleted_at IS NULL;
    `);

    console.log(`📊 ${variantsResult.rows.length} variants trouvés`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let noPrice = 0;

    console.log('\n💰 Traitement des prix...');

    for (const variant of variantsResult.rows) {
      const expectedPrice = skuToPriceMap.get(variant.sku);
      
      if (!expectedPrice) {
        noPrice++;
        continue;
      }

      // CAS 1: Pas de price_set du tout
      if (!variant.price_set_id) {
        // Créer price_set
        const priceSetId = `pset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await client.query(`
          INSERT INTO price_set (id, created_at, updated_at)
          VALUES ($1, NOW(), NOW());
        `, [priceSetId]);

        // Lier variant → price_set
        const linkId = `pvps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await client.query(`
          INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW());
        `, [linkId, variant.variant_id, priceSetId]);

        // Créer le prix
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
          priceSetId,
          'mad',
          expectedPrice,
          JSON.stringify({ value: (expectedPrice / 100).toFixed(2) })
        ]);

        created++;
      }
      // CAS 2: A un price_set mais pas de prix
      else if (!variant.price_id) {
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
          variant.price_set_id,
          'mad',
          expectedPrice,
          JSON.stringify({ value: (expectedPrice / 100).toFixed(2) })
        ]);

        created++;
      }
      // CAS 3: A un prix mais incorrect
      else if (variant.current_amount !== expectedPrice) {
        await client.query(`
          UPDATE price
          SET amount = $1,
              raw_amount = $2,
              updated_at = NOW()
          WHERE id = $3;
        `, [
          expectedPrice,
          JSON.stringify({ value: (expectedPrice / 100).toFixed(2) }),
          variant.price_id
        ]);

        updated++;
      }
      // CAS 4: Prix déjà correct
      else {
        skipped++;
      }

      const total = created + updated + skipped + noPrice;
      if (total % 100 === 0) {
        console.log(`   Progression: ${total}/${variantsResult.rows.length}`);
      }
    }

    console.log(`\n✅ RÉSUMÉ :`);
    console.log(`   💰 Prix créés : ${created}`);
    console.log(`   🔄 Prix mis à jour : ${updated}`);
    console.log(`   ✅ Prix déjà corrects : ${skipped}`);
    console.log(`   ⚠️  Pas de prix dans CSV : ${noPrice}`);
    console.log(`\n🎉 Terminé ! Rechargez votre site pour voir les vrais prix.`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('\n👋 Connexion fermée');
  }
}

fixPricesWithRealValues();
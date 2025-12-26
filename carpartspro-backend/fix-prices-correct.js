const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'carpartspro'
});

async function fixPrices() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Trouver la région Maroc
    const regionResult = await client.query(`
      SELECT id, name, currency_code 
      FROM region 
      WHERE name ILIKE '%maroc%' 
      LIMIT 1;
    `);

    if (regionResult.rows.length === 0) {
      console.log('❌ Région Maroc introuvable');
      return;
    }

    const region = regionResult.rows[0];
    console.log('✅ Région trouvée:', region.name);
    console.log('   ID:', region.id);
    console.log('   Devise:', region.currency_code);

    // 2. Trouver tous les variants sans price_set
    console.log('\n🔍 Recherche des variants sans price_set...');
    const variantsResult = await client.query(`
      SELECT pv.id, pv.title, p.title as product_title
      FROM product_variant pv
      JOIN product p ON pv.product_id = p.id
      LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      WHERE pvps.variant_id IS NULL
      AND pv.deleted_at IS NULL;
    `);

    console.log(`📊 ${variantsResult.rows.length} variants sans price_set trouvés`);

    if (variantsResult.rows.length === 0) {
      console.log('✅ Tous les variants ont déjà des price_sets !');
      
      // Vérifier ceux qui ont un price_set mais pas de prix
      console.log('\n🔍 Vérification des price_sets sans prix...');
      const noPriceResult = await client.query(`
        SELECT 
          pv.id as variant_id,
          pv.title as variant_title,
          ps.id as price_set_id
        FROM product_variant pv
        JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
        JOIN price_set ps ON pvps.price_set_id = ps.id
        LEFT JOIN price pr ON ps.id = pr.price_set_id AND pr.currency_code = $1
        WHERE pr.id IS NULL
        AND pv.deleted_at IS NULL
        AND ps.deleted_at IS NULL;
      `, [region.currency_code]);

      console.log(`📊 ${noPriceResult.rows.length} variants avec price_set mais sans prix`);

      if (noPriceResult.rows.length > 0) {
        console.log('\n💰 Ajout des prix manquants...');
        let pricesAdded = 0;

        for (const row of noPriceResult.rows) {
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
            row.price_set_id,
            region.currency_code,
            100.00,
            JSON.stringify({ value: "100.00" })
          ]);

          pricesAdded++;
          if (pricesAdded % 100 === 0) {
            console.log(`   Progression: ${pricesAdded}/${noPriceResult.rows.length}`);
          }
        }

        console.log(`✅ ${pricesAdded} prix ajoutés !`);
      }

      return;
    }

    // 3. Créer les price_sets et liens manquants
    console.log('\n🔧 Création des price_sets...');
    let created = 0;

    for (const variant of variantsResult.rows) {
      // Créer le price_set
      const priceSetId = `pset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO price_set (id, created_at, updated_at)
        VALUES ($1, NOW(), NOW());
      `, [priceSetId]);

      // Lier le variant au price_set (AVEC un ID pour la liaison !)
      const linkId = `pvps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW());
      `, [linkId, variant.id, priceSetId]);

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
        region.currency_code,
        100.00,
        JSON.stringify({ value: "100.00" })
      ]);

      created++;
      
      if (created % 100 === 0) {
        console.log(`   Progression: ${created}/${variantsResult.rows.length}`);
      }
    }

    console.log(`\n✅ Traitement terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - ${created} price_sets créés`);
    console.log(`   - ${created} liaisons variant↔price_set créées`);
    console.log(`   - ${created} prix à 100 MAD ajoutés`);
    console.log(`\n🎉 Tous vos variants ont maintenant des prix !`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n👋 Connexion fermée');
  }
}

fixPrices();
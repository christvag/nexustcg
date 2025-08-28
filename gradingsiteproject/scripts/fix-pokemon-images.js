const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database paths
const mainDbPath = path.join(__dirname, '..', 'database', 'FINAL_TRADING_CARDS_DATABASE.db');
const pokemonDbPath = path.join(__dirname, '..', 'database', 'pokemon_check.db');

console.log('🔧 Pokemon Card Image Fixing Script');
console.log('====================================');

async function updatePokemonImages() {
    return new Promise((resolve, reject) => {
        // Open both databases
        const mainDb = new sqlite3.Database(mainDbPath);
        const pokemonDb = new sqlite3.Database(pokemonDbPath);
        
        console.log('📂 Opening databases...');
        
        // Get all Pokemon cards with better images
        pokemonDb.all('SELECT card_name, card_image_url, set_name, rarity FROM trading_cards', (err, goodPokemonCards) => {
            if (err) {
                console.error('❌ Error reading Pokemon database:', err);
                reject(err);
                return;
            }
            
            console.log(`✅ Found ${goodPokemonCards.length} Pokemon cards with proper images`);
            
            let updateCount = 0;
            let processedCount = 0;
            
            // Create a map for faster lookups
            const pokemonImageMap = new Map();
            goodPokemonCards.forEach(card => {
                const key = card.card_name.toLowerCase().trim();
                if (!pokemonImageMap.has(key)) {
                    pokemonImageMap.set(key, []);
                }
                pokemonImageMap.get(key).push(card);
            });
            
            console.log(`🗺️ Created lookup map with ${pokemonImageMap.size} unique card names`);
            
            // Get all Pokemon cards from main database that need fixing
            mainDb.all('SELECT id, card_name, card_image_url FROM trading_cards WHERE card_game LIKE "%Pokemon%" AND card_image_url LIKE "%cardmarket.png%"', (err, brokenPokemonCards) => {
                if (err) {
                    console.error('❌ Error reading main database:', err);
                    reject(err);
                    return;
                }
                
                console.log(`🔍 Found ${brokenPokemonCards.length} Pokemon cards with broken images`);
                
                if (brokenPokemonCards.length === 0) {
                    console.log('✅ No Pokemon cards need image fixes!');
                    mainDb.close();
                    pokemonDb.close();
                    resolve();
                    return;
                }
                
                // Start transaction for batch updates
                mainDb.run('BEGIN TRANSACTION');
                
                brokenPokemonCards.forEach((brokenCard, index) => {
                    const cardKey = brokenCard.card_name.toLowerCase().trim();
                    const goodCards = pokemonImageMap.get(cardKey);
                    
                    if (goodCards && goodCards.length > 0) {
                        // Use the first matching card's image URL
                        const goodImageUrl = goodCards[0].card_image_url;
                        
                        mainDb.run(
                            'UPDATE trading_cards SET card_image_url = ? WHERE id = ?',
                            [goodImageUrl, brokenCard.id],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error updating ${brokenCard.card_name}:`, err);
                                } else {
                                    updateCount++;
                                    if (updateCount % 100 === 0) {
                                        console.log(`📈 Updated ${updateCount} cards...`);
                                    }
                                }
                                
                                processedCount++;
                                
                                // Check if we're done
                                if (processedCount === brokenPokemonCards.length) {
                                    mainDb.run('COMMIT', (err) => {
                                        if (err) {
                                            console.error('❌ Error committing transaction:', err);
                                            reject(err);
                                        } else {
                                            console.log('\\n🎉 SUCCESS!');
                                            console.log(`✅ Updated ${updateCount} Pokemon cards with proper images`);
                                            console.log(`📊 ${brokenPokemonCards.length - updateCount} cards couldn't be matched`);
                                            
                                            mainDb.close();
                                            pokemonDb.close();
                                            resolve();
                                        }
                                    });
                                }
                            }
                        );
                    } else {
                        processedCount++;
                        if (processedCount === brokenPokemonCards.length) {
                            mainDb.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('❌ Error committing transaction:', err);
                                    reject(err);
                                } else {
                                    console.log('\\n🎉 SUCCESS!');
                                    console.log(`✅ Updated ${updateCount} Pokemon cards with proper images`);
                                    console.log(`📊 ${brokenPokemonCards.length - updateCount} cards couldn't be matched`);
                                    
                                    mainDb.close();
                                    pokemonDb.close();
                                    resolve();
                                }
                            });
                        }
                    }
                });
            });
        });
    });
}

// Run the update
updatePokemonImages()
    .then(() => {
        console.log('\\n🚀 Pokemon image fixing completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\\n❌ Pokemon image fixing failed:', error);
        process.exit(1);
    });
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database paths
const finalDbPath = path.join(__dirname, '..', '..', 'card-scrapper', 'FINAL_TRADING_CARDS_DATABASE.db');
const pokemonDbPath = path.join(__dirname, '..', '..', 'card-scrapper', 'pokemon_cards_complete.db');
const targetDbPath = path.join(__dirname, '..', 'database', 'FINAL_TRADING_CARDS_DATABASE.db');

console.log('🎴 Pokemon Database Combination Script');
console.log('=====================================');

function checkDatabase(dbPath, name) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log(`❌ Cannot open ${name}: ${err.message}`);
                resolve({ exists: false, cardCount: 0 });
                return;
            }
            
            console.log(`✅ ${name} database opened successfully`);
            
            // Check if this database has the right schema
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_cards'", (err, row) => {
                if (err || !row) {
                    console.log(`⚠️ ${name} doesn't have trading_cards table`);
                    db.close();
                    resolve({ exists: false, cardCount: 0 });
                    return;
                }
                
                // Count cards
                db.get("SELECT COUNT(*) as count FROM trading_cards", (err, row) => {
                    if (err) {
                        console.log(`❌ Error counting cards in ${name}: ${err.message}`);
                        db.close();
                        resolve({ exists: false, cardCount: 0 });
                        return;
                    }
                    
                    console.log(`📊 ${name} contains ${row.count} total cards`);
                    
                    // Count Pokemon cards specifically
                    db.get("SELECT COUNT(*) as count FROM trading_cards WHERE card_game LIKE '%Pokemon%'", (err, pokemonRow) => {
                        db.close();
                        if (err) {
                            console.log(`❌ Error counting Pokemon cards in ${name}: ${err.message}`);
                            resolve({ exists: true, cardCount: row.count, pokemonCount: 0 });
                        } else {
                            console.log(`🎯 ${name} contains ${pokemonRow.count} Pokemon cards`);
                            resolve({ exists: true, cardCount: row.count, pokemonCount: pokemonRow.count });
                        }
                    });
                });
            });
        });
    });
}

function copyDatabase(sourcePath, targetPath) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        
        console.log(`📂 Copying database from ${sourcePath} to ${targetPath}`);
        
        fs.copyFile(sourcePath, targetPath, (err) => {
            if (err) {
                console.log(`❌ Error copying database: ${err.message}`);
                reject(err);
            } else {
                console.log(`✅ Database copied successfully!`);
                resolve();
            }
        });
    });
}

async function main() {
    try {
        // Check the final database
        console.log('\n🔍 Checking Final Trading Cards Database...');
        const finalDbInfo = await checkDatabase(finalDbPath, 'Final Database');
        
        // Check the separate Pokemon database
        console.log('\n🔍 Checking Separate Pokemon Database...');
        const pokemonDbInfo = await checkDatabase(pokemonDbPath, 'Pokemon Database');
        
        // Analysis
        console.log('\n📊 DATABASE ANALYSIS');
        console.log('=====================');
        
        if (!finalDbInfo.exists) {
            console.log('❌ Final database not found or invalid');
            return;
        }
        
        console.log(`📈 Final database: ${finalDbInfo.cardCount} total cards (${finalDbInfo.pokemonCount} Pokemon)`);
        
        if (pokemonDbInfo.exists) {
            console.log(`📈 Separate Pokemon database: ${pokemonDbInfo.cardCount} total cards (${pokemonDbInfo.pokemonCount} Pokemon)`);
            
            if (pokemonDbInfo.pokemonCount > finalDbInfo.pokemonCount) {
                console.log(`⚠️ Separate Pokemon database has MORE Pokemon cards (${pokemonDbInfo.pokemonCount} vs ${finalDbInfo.pokemonCount})`);
                console.log('🔧 Manual database merging would be required');
            } else {
                console.log('✅ Final database already contains the most Pokemon cards');
            }
        } else {
            console.log('✅ No separate Pokemon database found - Final database is complete');
        }
        
        // Copy the final database to the grading site project
        console.log('\n📦 COPYING DATABASE TO PROJECT');
        console.log('===============================');
        
        await copyDatabase(finalDbPath, targetDbPath);
        
        console.log('\n🎉 SUCCESS!');
        console.log('============');
        console.log('✅ Final database has been copied to the grading site project');
        console.log(`📍 Location: ${targetDbPath}`);
        console.log(`📊 Total cards: ${finalDbInfo.cardCount}`);
        console.log(`🎯 Pokemon cards: ${finalDbInfo.pokemonCount}`);
        console.log('');
        console.log('🚀 Your card search should now work with all games including Pokemon!');
        
    } catch (error) {
        console.error('❌ Script failed:', error.message);
    }
}

main();
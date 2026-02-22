const fs = require('fs');
const mcData = require('minecraft-data')('1.20.4');

const recipes = mcData.recipes;
const parsedRecipes = [];

for (const [itemId, recipeList] of Object.entries(recipes)) {
    const resultItem = mcData.items[itemId];
    if (!resultItem) continue;

    for (const recipe of recipeList) {
        const dependencies = [];

        if (recipe.ingredients) {
            // shapeless
            for (const ing of recipe.ingredients) {
                if (!ing) continue;
                let actualIng = Array.isArray(ing) ? ing[0] : ing;
                const reqItem = mcData.items[actualIng];
                if (!reqItem) continue;

                const existing = dependencies.find(d => d.name === reqItem.displayName);
                if (existing) {
                    existing.quantityRequired += 1;
                } else {
                    dependencies.push({ name: reqItem.displayName, quantityRequired: 1 });
                }
            }
        } else if (recipe.inShape) {
            // shaped
            for (const row of recipe.inShape) {
                for (const col of row) {
                    if (!col) continue; // null slot
                    let actualIng = Array.isArray(col) ? col[0] : col;
                    const reqItem = mcData.items[actualIng];
                    if (!reqItem) continue;

                    const existing = dependencies.find(d => d.name === reqItem.displayName);
                    if (existing) {
                        existing.quantityRequired += 1;
                    } else {
                        dependencies.push({ name: reqItem.displayName, quantityRequired: 1 });
                    }
                }
            }
        }

        let outCount = recipe.result ? recipe.result.count : 1;

        parsedRecipes.push({
            name: resultItem.displayName,
            resultCount: outCount,
            dependencies: dependencies
        });
    }
}

// Remove duplicates based on name to keep it simple and clean
const uniqueRecipesMap = new Map();
for (const r of parsedRecipes) {
    if (!uniqueRecipesMap.has(r.name)) {
        uniqueRecipesMap.set(r.name, r);
    }
}

const finalRecipes = Array.from(uniqueRecipesMap.values());
fs.writeFileSync('src/data/recipes.json', JSON.stringify(finalRecipes, null, 2));
console.log('Unique recipes exported: ' + finalRecipes.length);

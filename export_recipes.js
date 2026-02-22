const fs = require('fs');
const mcData = require('minecraft-data')('1.20.4'); // or whatever recent version works

const items = mcData.items;
const recipes = mcData.recipes;

const parsedRecipes = [];

// recipes is an object where key is item ID, value is array of recipes for that item
for (const [itemId, recipeList] of Object.entries(recipes)) {
    const resultItem = mcData.items[itemId];
    if (!resultItem) continue;

    for (const recipe of recipeList) {
        // We just want to extract dependencies
        const dependencies = [];

        if (recipe.ingredients) {
            // shapeless recipe
            for (const ing of recipe.ingredients) {
                if (!ing) continue;
                // ing is occasionally an array of options (for tags)
                let actualIng = Array.isArray(ing) ? ing[0] : ing;
                const reqItem = mcData.items[actualIng];
                if (!reqItem) continue;

                const existing = dependencies.find(d => d.name === reqItem.displayName);
                if (existing) {
                    existing.quantityRequired += Math.abs(recipe.inShape ? 1 : 1); // shape gives 1
                } else {
                    dependencies.push({
                        name: reqItem.displayName,
                        quantityRequired: 1
                    });
                }
            }
        } else if (recipe.inShape) {
            // shaped recipe
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
                        dependencies.push({
                            name: reqItem.displayName,
                            quantityRequired: 1
                        });
                    }
                }
            }
        }

        // Count quantity
        let outCount = recipe.result ? recipe.result.count : 1;

        parsedRecipes.push({
            name: resultItem.displayName, // e.g. "Diamond Sword"
            resultCount: outCount,
            dependencies: dependencies
        });
    }
}

// Remove duplicates or just keep all for simplicity. Some items have multiple recipes.
fs.writeFileSync('src/data/recipes.json', JSON.stringify(parsedRecipes, null, 2));
console.log('Recipes exported: ' + parsedRecipes.length);

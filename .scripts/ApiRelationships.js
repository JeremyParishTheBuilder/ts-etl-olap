import fs from 'fs';
import path from 'path';

const cacheFile = path.resolve('./.cache/api_surface.json');
if (!fs.existsSync(cacheFile)) {
    console.error("Error: Cache file missing. Run ApiSurface.js first to generate data.");
    process.exit(1);
}

const modules = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

// Build a fast lookup map of all known class and type names across the entire module surface
const knownTypes = new Map();
modules.forEach(mod => {
    mod.exports.forEach(exp => {
        knownTypes.set(exp.name, { file: mod.file, type: exp.type });
    });
});

console.log("## Structural Module Relationships");
console.log("=".repeat(40) + "\n");

modules.forEach(mod => {
    console.log(`### ${mod.file}`);
    let relations = new Set();

    mod.exports.forEach(exp => {
        if (exp.type === 'class') {
            const lines = exp.raw.split('\n');
            
            lines.forEach(line => {
                // Skip the class declaration line itself to avoid self-referencing
                if (line.includes('export class') || line.includes('class ')) return;

                // Scan every line of the class body for occurrences of our known domain names
                knownTypes.forEach((meta, typeName) => {
                    if (typeName === exp.name) return; // Don't match self
                    if (typeName.endsWith('Id') || typeName.endsWith('Ids')) return;

                    // Check if the property explicitly references the type name (e.g., NamedObjectStore<Unique, UniqueId>)
                    // Word boundary check (\b) prevents false positives on partial string matching
                    const regex = new RegExp(`\\b${typeName}\\b`);
                    
                    if (regex.test(line)) {
                        // Heuristic: If it's a collection or array structure, it's strongly indicative of structural ownership
                        if (line.includes('Store<') || line.includes('Map<') || line.includes('[]') || line.includes('Set<')) {
                            relations.add(`  ↳ [Owns / Contains Collection] -> ${typeName} (defined via property: \`${line.trim()}\`)`);
                        } else {
                            relations.add(`  ↳ [References / Uses Class]    -> ${typeName} (defined via property: \`${line.trim()}\`)`);
                        }
                    }
                });
            });
        }
    });

    // Fallback: If no class properties matched, check file-level imports to see what else it hooks into
    if (relations.size === 0) {
        mod.imports.forEach(impPath => {
            const baseName = path.basename(impPath).replace(/\.[^/.]+$/, "");
            const targetMod = modules.find(m => m.file.replace(/\.[^/.]+$/, "") === baseName);
            if (targetMod && targetMod.file !== mod.file) {
                relations.add(`  ↳ [Imports / References File]  -> ${targetMod.file}`);
            }
        });
    }

    if (relations.size > 0) {
        // Print sorted, clean relationships
        Array.from(relations).sort().forEach(r => console.log(r));
        console.log("");
    } else {
        console.log("  (Stand-alone utility module or leaf node—no direct internal dependencies)\n");
    }
});
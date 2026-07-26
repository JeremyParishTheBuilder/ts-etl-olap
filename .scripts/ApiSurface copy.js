import fs from 'fs';
import path from 'path';

function extractTypeScriptSurface(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // 1. Clean out comments completely
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    
    let fileData = {
        file: fileName,
        path: filePath,
        imports: [],
        exports: []
    };

    // 2. Extract and strip ALL imports out of the text to prevent parser collision
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"](.+?)['"]/g;
    let match;
    while ((match = importRegex.exec(cleanContent)) !== null) {
        if (!fileData.imports.includes(match[1])) {
            fileData.imports.push(match[1]);
        }
    }
    
    const contentWithoutImports = cleanContent.replace(/import\s+[\s\S]*?\s+from\s+['"].+?['"];?/g, '');
    const lines = contentWithoutImports.split('\n');

    // 3. Process the lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const isClass = /^(export\s+)?(default\s+)?(abstract\s+)?class\s+/.test(line);
        const isInterface = /^(export\s+)?(default\s+)?interface\s+/.test(line);
        const isType = /^(export\s+)?type\s+/.test(line);

        // --- HANDLE STANDALONE TYPES & INTERFACES ---
        if ((isInterface || isType) && !isClass) {
            let nameMatch = line.match(/(?:interface|type)\s+([a-zA-Z0-9_]+)/);
            let name = nameMatch ? nameMatch[1] : 'Unknown';
            
            let typeLines = [lines[i]];
            let braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            
            if (!line.endsWith(';') && (line.includes('{') || line.includes('='))) {
                let j = i + 1;
                while (j < lines.length) {
                    const subLine = lines[j].trim();
                    typeLines.push(lines[j]);
                    braceDepth += (subLine.match(/\{/g) || []).length - (subLine.match(/\}/g) || []).length;
                    
                    if (subLine.endsWith(';') || (line.includes('{') && braceDepth <= 0)) {
                        i = j;
                        break;
                    }
                    j++;
                }
            }
            fileData.exports.push({ type: 'signature', name: name, raw: typeLines.join('\n').trimEnd() });
            continue;
        }

        // --- SCOPED CLASS SCANNING PARSER ---
        if (isClass) {
            let nameMatch = line.match(/class\s+([a-zA-Z0-9_]+)/);
            let name = nameMatch ? nameMatch[1] : 'Unknown';
            
            let classHeader = line.includes('{') ? line.split('{')[0].trim() : line;
            let block = [classHeader];
            
            // Gather the entire class body lines safely by tracking structural outer brackets
            let classBodyLines = [];
            let classBraceDepth = 1;
            if (line.includes('{')) {
                const opens = (line.split('{').pop().match(/\{/g) || []).length;
                const closes = (line.split('{').pop().match(/\}/g) || []).length;
                classBraceDepth += (opens - closes);
            }

            let j = i + 1;
            while (j < lines.length && classBraceDepth > 0) {
                const trimmed = lines[j].trim();
                const opens = (trimmed.match(/\{/g) || []).length;
                const closes = (trimmed.match(/\}/g) || []).length;

                if (classBraceDepth === 1 && trimmed === '}') {
                    classBraceDepth = 0;
                    break;
                }

                classBodyLines.push(lines[j]);
                classBraceDepth += (opens - closes);
                j++;
            }
            i = j; // Advance outer main file pointer past the entire class

            // Scan through the structural interior class body lines
            for (let k = 0; k < classBodyLines.length; k++) {
                const bodyLine = classBodyLines[k].trim();
                if (!bodyLine || bodyLine === '}') continue;

                // Skip members explicitly declared private or protected to keep the surface clean
                if (bodyLine.startsWith('private ') || bodyLine.startsWith('protected ') || bodyLine.startsWith('#')) {
                    let pOpens = (bodyLine.match(/\{/g) || []).length;
                    let pCloses = (bodyLine.match(/\}/g) || []).length;
                    let pDepth = pOpens - pCloses;
                    
                    let skipIdx = k + 1;
                    while (skipIdx < classBodyLines.length && (pDepth > 0 || (!bodyLine.includes(';') && !bodyLine.includes('{') && pDepth === 0))) {
                        const sLine = classBodyLines[skipIdx].trim();
                        pDepth += (sLine.match(/\{/g) || []).length - (sLine.match(/\}/g) || []).length;
                        k = skipIdx;
                        if (sLine.includes(';') && pDepth === 0) break;
                        skipIdx++;
                    }
                    continue;
                }

                // Accumulate the entire statement line block (including signature + body implementation)
                let memberLines = [classBodyLines[k]];
                let fullStr = bodyLine;
                
                let parenDepth = (bodyLine.match(/\(/g) || []).length - (bodyLine.match(/\)/g) || []).length;
                let braceDepth = (bodyLine.match(/\{/g) || []).length - (bodyLine.match(/\}/g) || []).length;
                
                let lookAheadIdx = k + 1;
                
                while (lookAheadIdx < classBodyLines.length) {
                    if (parenDepth <= 0 && braceDepth <= 0) {
                        if (fullStr.includes(';') || fullStr.includes('}')) {
                            break;
                        }
                    }
                    
                    const nextLinePeek = classBodyLines[lookAheadIdx].trim();
                    // If the next line introduces a brand new distinct member, break early
                    if (/^(public\s+|static\s+|async\s+|abstract\s+|readonly\s+|get\s+|set\s+|constructor\b|[\w#]+\s*\()/.test(nextLinePeek) && parenDepth <= 0 && braceDepth <= 0) {
                        break;
                    }

                    if (nextLinePeek) {
                        memberLines.push(classBodyLines[lookAheadIdx]);
                        fullStr += ' ' + nextLinePeek;
                        
                        parenDepth += (nextLinePeek.match(/\(/g) || []).length - (nextLinePeek.match(/\)/g) || []).length;
                        braceDepth += (nextLinePeek.match(/\{/g) || []).length - (nextLinePeek.match(/\}/g) || []).length;
                        k = lookAheadIdx;
                    }
                    lookAheadIdx++;
                }

                // Clean multi-line whitespace signatures into single-line displays
                let cleanedSig = fullStr.replace(/\s+/g, ' ').trim();
                
                // --- STRIP IMPLEMENTATION VIA CHAR SCANNING ---
                // I'm tracking parentheses and curly braces left-to-right to find where the signature ends.
                let scanParen = 0;
                let scanBrace = 0;
                let cutIndex = -1;

                for (let idx = 0; idx < cleanedSig.length; idx++) {
                    const char = cleanedSig[idx];
                    if (char === '(') scanParen++;
                    if (char === ')') scanParen--;
                    if (char === '{') scanBrace++;
                    if (char === '}') scanBrace--;

                    // If we encounter a '{' when parentheses are fully balanced, and we haven't already 
                    // stepped inside an inline type/object literal block, it should be the start of the method body.
                    if (char === '{' && scanParen === 0 && scanBrace === 1) {
                        cutIndex = idx;
                        break;
                    }
                }

                if (cutIndex !== -1) {
                    cleanedSig = cleanedSig.substring(0, cutIndex).trimEnd();
                }

                // Strip trailing initializations or standard punctuation boundaries safely
                cleanedSig = cleanedSig.replace(/\s*=\s*[\s\S]*$/, '');  
                if (cleanedSig.endsWith(';')) {
                    cleanedSig = cleanedSig.slice(0, -1).trimEnd();
                }
                cleanedSig = cleanedSig.trim();

                // Filter out standard operational keywords that wouldn't represent declaration roots
                if (['super()', 'super', 'this.', 'return', 'if', 'for', 'while', 'switch'].some(keyword => cleanedSig.startsWith(keyword))) {
                    continue;
                }

                // Ensure it looks like a valid field declaration or method signature
                const tokens = cleanedSig.split(' ');
                if (cleanedSig.includes('(') || cleanedSig.includes(':') || tokens.some(t => ['public', 'static', 'readonly', 'async', 'abstract', 'get', 'set'].includes(t))) {
                    block.push('  ' + cleanedSig);
                }
            }

            block.push('}');
            fileData.exports.push({ type: 'class', name: name, raw: block.join('\n') });
        }
    }

    return fileData.exports.length > 0 ? fileData : null;
}

function processDirectory(targetDir) {
    const absolutePath = path.resolve(targetDir);
    if (!fs.existsSync(absolutePath)) return;

    function walk(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            if (file.startsWith('.') || ['node_modules', 'dist', 'build'].includes(file)) return;
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                results = results.concat(walk(fullPath));
            } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
                results.push(fullPath);
            }
        });
        return results;
    }

    const filesData = walk(absolutePath).map(extractTypeScriptSurface).filter(Boolean);
    
    const cacheDir = path.resolve('./.cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    fs.writeFileSync(path.join(cacheDir, 'api_surface.json'), JSON.stringify(filesData, null, 2));
    
    filesData.forEach(f => {
        console.log(`### File: ${f.file}`);
        f.exports.forEach(e => console.log(e.raw + '\n'));
        console.log('='.repeat(40));
    });
}

const target = process.argv[2] || '.';
processDirectory(target);
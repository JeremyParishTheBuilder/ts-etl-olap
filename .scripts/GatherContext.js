import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (error) {
        return `[Error running command "${command}"]: ${error.message}\n`;
    }
}

function main() {
    // 1. Determine the target directory from arguments, default to current directory
    const targetDir = process.argv[2] || '.';
    const absoluteTarget = path.resolve(targetDir);
    const targetFolder = path.basename(absoluteTarget) || 'root';

    console.log(`🚀 Gathering context for: ${absoluteTarget}`);

    // Ensure cache directory exists
    const cacheDir = path.resolve('./.cache');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // 2. Build the markdown content piece by piece
    let markdown = [];
    markdown.push(`# Module Context Snapshot: \`${targetFolder}\``);
    markdown.push(`*Generated on: ${timestamp}*`);
    markdown.push(`*Target Path: \`${absoluteTarget}\`*\n`);
    markdown.push('---');

    // Section 1: Directory Tree
    console.log(' -> Generating Directory Tree...');
    markdown.push('## 1. Directory Tree\n```text');
    // Using your python visualizer script
    const treeOutput = runCommand(`python3 .scripts/DirectoryVisualizer.py "${targetDir}"`);
    // Strip the "Targeting:" headers out of the python visualizer stdout for a cleaner markdown look
    const cleanTree = treeOutput.split('----------------------------------------')[1] || treeOutput;
    markdown.push(cleanTree.trim());
    markdown.push('```\n---');

    // Section 2: Public API Surface
    console.log(' -> Extracting API Surface...');
    markdown.push('## 2. Public API Surface & Component Signatures\n');
    const apiOutput = runCommand(`node .scripts/ApiSurface.js "${targetDir}"`);
    // Split to separate the console logging from the raw extraction logs if any
    const cleanApi = apiOutput.split('================================================')[1] || apiOutput;
    markdown.push(cleanApi.trim());
    markdown.push('\n---');

    // Section 3: Structural Relationships
    console.log(' -> Mapping Structural Relationships...');
    markdown.push('## 3. Structural Module Relationships\n');
    const relationshipOutput = runCommand('node .scripts/ApiRelationships.js');
    const cleanRelations = relationshipOutput.split('========================================')[1] || relationshipOutput;
    markdown.push(cleanRelations.trim());

    // 3. Write out to the final consolidated context file
    const outputPath = path.join(cacheDir, 'context.md');
    fs.writeFileSync(outputPath, markdown.join('\n'), 'utf8');

    console.log(`\n✨ Success! Compiled context saved to: ${outputPath}`);
}

main();
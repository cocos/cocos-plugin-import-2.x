const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'creator');
const output = path.join(root, 'dist');
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const options = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
if (options.errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(options.errors, {
    getCanonicalFileName: name => name, getCurrentDirectory: () => root, getNewLine: () => '\n',
}));

// Creator supplies Editor/Electron types at runtime. Compile without a full editor SDK.
fs.rmSync(output, { recursive: true, force: true });
function compile(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) compile(file);
        else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
                fileName: file, compilerOptions: options.options, reportDiagnostics: true,
            });
            const errors = result.diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error);
            if (errors.length) throw new Error(`${file}: ${errors.map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n')}`);
            const target = path.join(output, path.relative(source, file).replace(/\.ts$/, '.js'));
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, result.outputText);
        }
    }
}
compile(source);

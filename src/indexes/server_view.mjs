import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/indexes/server_view.js',
    output: {
        format: 'iife',
        file: 'dist/server_view.js',
        name: 'GC',
        exports: 'auto'
    },
    treeshake: false,
    plugins: [
        commonjs({
            transformMixedEsModules: true,
            defaultIsModuleExports: true,
        }),
    ],
};
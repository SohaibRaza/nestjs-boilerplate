import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        alias: {
            '@app': resolve(__dirname, './src/app'),
            '@common': resolve(__dirname, './src/common'),
            '@configs': resolve(__dirname, './src/configs'),
            '@config': resolve(__dirname, './src/configs/index.ts'),
            '@modules': resolve(__dirname, './src/modules'),
            '@routes': resolve(__dirname, './src/router/routes'),
            '@router': resolve(__dirname, './src/router/router.module.ts'),
            '@migration': resolve(__dirname, './src/migration'),
            '@test': resolve(__dirname, './test'),
        },
    },
});

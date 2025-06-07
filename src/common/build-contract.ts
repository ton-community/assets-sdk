import { parse } from 'path';

import { compileFunc, SourceResolver } from '@ton-community/func-js';

import { Writer } from './writer';

function pascalCase(str: string): string {
    return `${str}`
        .replace(/^(.)/, (_, firstLetter) => firstLetter.toLowerCase())
        .replace(/[-_](.)/g, (_, nextLetter) => nextLetter.toUpperCase());
}

function fileName(src: string): string {
    return parse(src).name;
}

function generateParamName(output: string): string {
    return pascalCase(fileName(output)) + 'Code';
}

export async function buildContract(args: {
    sources: SourceResolver;
    writer: Writer;
    targets: string[];
    output: string;
}) {
    const compileResult = await compileFunc({
        sources: args.sources,
        targets: args.targets,
    });

    if (compileResult.status === 'error') {
        throw new Error(compileResult.message);
    }

    const { codeBoc } = compileResult;
    const paramName = generateParamName(args.output);
    const content = `export const ${paramName} = {
        codeBoc: '${codeBoc}'
    };`;

    const { writer } = args;
    writer(args.output, Buffer.from(content, 'ascii'));
    // eslint-disable-next-line no-console
    console.log(`Contract ${args.output} was successfully built`);
}

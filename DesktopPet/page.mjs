import { stripTypeScriptTypes } from 'node:module';
import { readFileSync } from 'node:fs';
const source = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const script = stripTypeScriptTypes(source('pet.ts'));
const ghost = readFileSync(new URL('ghosty.png', import.meta.url)).toString('base64');
export const page = source('pet.html').replace('BUNNY_ART', () => source('bunny.svg')).replace('BAT_ART', () => source('bat.svg')).replace('SKELETON_ART', () => source('skeleton.svg')).replace('GHOST_IMAGE', ghost).replace('/* PET_SCRIPT */', () => script);

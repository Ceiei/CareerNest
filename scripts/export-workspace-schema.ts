import { writeFileSync } from 'node:fs';
import { CHOICE_SETS, PATH_CHOICES } from '../utils/choices';
import { BASIC_GROUPS } from '../utils/basic-fields';
import { COLLECTION_SCHEMAS } from '../utils/schema';

// Both clients use one set of labels, canonical values, and aliases.
writeFileSync(new URL('../local_service/static/schema.json', import.meta.url), JSON.stringify({
  choices: CHOICE_SETS, paths: PATH_CHOICES, groups: BASIC_GROUPS, collections: COLLECTION_SCHEMAS
}, null, 2) + '\n');

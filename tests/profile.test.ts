import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE, flattenProfile, mergeProfile, setProfilePath } from '../utils/profile';

describe('profile helpers', () => {
  it('creates repeated records from a Feishu path', () => {
    const profile = structuredClone(EMPTY_PROFILE);
    setProfilePath(profile, 'education.0.school', '示例大学');
    expect(profile.education[0]?.school).toBe('示例大学');
  });

  it('marks sensitive candidates', () => {
    const profile = structuredClone(EMPTY_PROFILE); profile.personal.phone = '13800000000';
    expect(flattenProfile(profile)[0]?.sensitive).toBe(true);
  });

  it('migrates old records with stable ids and schema version', () => {
    const legacy = { ...structuredClone(EMPTY_PROFILE), schemaVersion: 0, education: [{ school: '示例大学' }] };
    const migrated = mergeProfile(structuredClone(EMPTY_PROFILE), legacy);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.education[0]?.id).toBeTruthy();
  });
});

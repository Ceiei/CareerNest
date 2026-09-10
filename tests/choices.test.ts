import { describe, expect, it } from 'vitest';
import { canonicalChoiceValue, choiceKeyForPath, choiceVariants } from '../utils/choices';
import { EMPTY_PROFILE, flattenProfile } from '../utils/profile';

describe('canonical profile choices', () => {
  it('keeps education level and academic degree as separate concepts', () => {
    expect(choiceKeyForPath('education.3.degree')).toBe('educationLevel');
    expect(choiceKeyForPath('education.3.academicDegree')).toBe('academicDegree');
    expect(canonicalChoiceValue('educationLevel', '本科生')).toBe('本科');
    expect(canonicalChoiceValue('academicDegree', 'BEng')).toBe('学士');
    expect(canonicalChoiceValue('academicDegree', '本科')).toBeUndefined();
  });

  it('provides aliases for target-site option matching', () => {
    expect(choiceVariants('学士')).toContain("bachelor's degree");
    expect(choiceVariants('全日制')).toContain('full-time');
  });

  it('marks configured profile values as choices', () => {
    const profile = structuredClone(EMPTY_PROFILE); profile.preferences.adjustmentAccepted = '是';
    expect(flattenProfile(profile, 'academic')[0]?.valueType).toBe('choice');
  });
});

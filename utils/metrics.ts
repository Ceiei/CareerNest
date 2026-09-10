export interface EvaluationCase { expectedKey?: string; predictedKey?: string; answerable: boolean }
export interface EvaluationMetrics { coverage: number; accuracy: number; answered: number; correct: number; answerable: number }

export function calculateMetrics(cases: EvaluationCase[]): EvaluationMetrics {
  const answerable = cases.filter((item) => item.answerable);
  const answered = answerable.filter((item) => Boolean(item.predictedKey));
  const correct = answered.filter((item) => item.predictedKey === item.expectedKey);
  return {
    coverage: answerable.length ? answered.length / answerable.length : 0,
    accuracy: answered.length ? correct.length / answered.length : 0,
    answered: answered.length,
    correct: correct.length,
    answerable: answerable.length
  };
}

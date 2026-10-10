export const grades = [
  {
    grade: "+A",
    minScore: 95,
    label: "Almost Flawless",
    description:
      "Your system is highly secure with minimal vulnerabilities. Keep up the good work!",
    color: "text-[#cfc508]",
  },
  {
    grade: "A",
    minScore: 90,
    label: "Excellent",
    description:
      "Your system is secure with very few vulnerabilities. Great job!",
    color: "text-[#3FB68B]",
  },
  {
    grade: "B",
    minScore: 75,
    label: "Good",
    description:
      "Your system is relatively secure, but there are some vulnerabilities that need attention.",
    color: "text-[#FFC107]",
  },
  {
    grade: "C",
    minScore: 60,
    label: "Average",
    description:
      "Your system has several vulnerabilities. It's important to address these issues to improve security.",
    color: "text-[#FF9800]",
  },
  {
    grade: "D",
    minScore: 40,
    label: "Poor",
    description:
      "Your system has significant security vulnerabilities. Immediate action is required to address these issues.",
    color: "text-[#F44336]",
  },
  {
    grade: "F",
    minScore: 0,
    label: "Failing",
    description:
      "Your system is highly vulnerable and at risk. Immediate action is required to address these issues.",
    color: "text-[#B71C1C]",
  },
] as const;

export type Grade = (typeof grades)[number]["grade"];

export function getGrade(score: number) {
  return grades.find((g) => score >= g.minScore) ?? grades[grades.length - 1];
}

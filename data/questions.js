// Dummy question bank. 20 questions per module, as required by the spec.
// In a real system these would come from a database / CMS.

function makeSet(prefix, subject, topics) {
  const qs = [];
  for (let i = 1; i <= 20; i++) {
    const topic = topics[(i - 1) % topics.length];
    qs.push({
      id: `${prefix}-${i}`,
      text: `[${topic}] Sample ${subject} question #${i}: Explain / solve the standard problem associated with "${topic}" (dummy placeholder question ${i}).`
    });
  }
  return qs;
}

const QUESTION_BANK = {
  "VIII CBSE": makeSet(
    "cbse8",
    "Class VIII CBSE",
    [
      "Rational Numbers",
      "Linear Equations in One Variable",
      "Understanding Quadrilaterals",
      "Practical Geometry",
      "Data Handling",
      "Squares and Square Roots",
      "Cubes and Cube Roots",
      "Comparing Quantities",
      "Algebraic Expressions and Identities",
      "Mensuration"
    ]
  ),
  "NEET": makeSet(
    "neet",
    "NEET",
    [
      "Physics - Laws of Motion",
      "Physics - Thermodynamics",
      "Chemistry - Chemical Bonding",
      "Chemistry - Organic Reactions",
      "Biology - Cell Structure",
      "Biology - Genetics and Evolution",
      "Physics - Optics",
      "Chemistry - Periodic Table",
      "Biology - Human Physiology",
      "Physics - Electrostatics"
    ]
  )
};

module.exports = { QUESTION_BANK };

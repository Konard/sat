// Define the NAND function
function nand(a, b) {
  return !(a && b);
}

// Function to evaluate boolean formula with a given variable assignment
function evaluateFormula(formula, assignment) {
  // Replace variables in the formula with their values from the assignment
  let evalFormula = formula;
  for (let variable in assignment) {
    const value = assignment[variable] ? 'true' : 'false';
    // Replace all occurrences of the variable with its value
    const regex = new RegExp('\\b' + variable + '\\b', 'g');
    evalFormula = evalFormula.replace(regex, value);
  }
  // Evaluate the formula
  try {
    // Use Function constructor to include the nand function in the scope
    return Function('nand', `return ${evalFormula}`)(nand);
  } catch (e) {
    // In case of error, return false
    return false;
  }
}

// Function to generate all possible variable assignments
function generateAssignments(variables, index, currentAssignment, assignments) {
  if (index === variables.length) {
    assignments.push(Object.assign({}, currentAssignment));
    return;
  }
  // Assign true to the variable
  currentAssignment[variables[index]] = true;
  generateAssignments(variables, index + 1, currentAssignment, assignments);

  // Assign false to the variable
  currentAssignment[variables[index]] = false;
  generateAssignments(variables, index + 1, currentAssignment, assignments);
}

// Main SAT solver function
function satSolver(formula) {
  // Extract variables from the formula
  const variables = Array.from(new Set(formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)));
  const assignments = [];
  generateAssignments(variables, 0, {}, assignments);

  // Check each assignment
  for (let assignment of assignments) {
    if (evaluateFormula(formula, assignment)) {
      return {
        satisfiable: true,
        assignment: assignment
      };
    }
  }
  return {
    satisfiable: false,
    assignment: null
  };
}

// Function to test small formulas
function testSmallFormulas() {
  const testCases = [
    {
      formula: 'nand(x1, x1)', // Equivalent to NOT x1
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(x1, x1), nand(x1, x1))', // Equivalent to x1
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(x1, x1), x1)', // Always true
      expected: 'satisfiable'
    },
    {
      formula: 'nand(x1, x1) && x1', // (NOT x1) AND x1, unsatisfiable
      expected: 'unsatisfiable'
    },
    {
      formula: 'nand(nand(x1, x1), nand(x2, x2))', // Equivalent to x1 OR x2
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(nand(x1, x1), nand(x2, x2)), nand(nand(x1, x1), nand(x2, x2)))', // Equivalent to x1 AND x2
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(x1, x2), nand(x1, x2))', // Equivalent to x1 AND x2
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(x1, x1), x1)', // Always true
      expected: 'satisfiable'
    },
    {
      formula: 'nand(x1, x1) && nand(nand(x1, x1), nand(x1, x1))', // (NOT x1) AND x1, unsatisfiable
      expected: 'unsatisfiable'
    }
  ];

  for (let testCase of testCases) {
    console.log(`Testing formula: ${testCase.formula}`);
    const result = satSolver(testCase.formula);
    const status = result.satisfiable ? 'satisfiable' : 'unsatisfiable';

    if (status === testCase.expected) {
      console.log(`Result: ${status} (as expected)`);
      if (result.satisfiable) {
        console.log(`Assignment: ${JSON.stringify(result.assignment)}`);
      }
    } else {
      console.error(`Result: ${status} (unexpected)`);
      if (result.satisfiable) {
        console.error(`Assignment: ${JSON.stringify(result.assignment)}`);
      }
    }
    console.log('-------------------------------');
  }
}

// Hypothetical polynomial-time SAT solver using only NAND operations
function hypotheticalPolynomialTimeSATSolver(formula) {
  return satSolver(formula);

  // Hypothetical polynomial-time SAT solver
  // Replace this with an actual algorithm if found
  throw new Error("Not implemented. Solving this would prove P = NP.");
}

// Run the small formula tests
testSmallFormulas();

// You can still include the runtime analysis for larger formulas if desired
// function testSATSolverWithRuntime() {
//   // ... (existing code)
// }
// testSATSolverWithRuntime();
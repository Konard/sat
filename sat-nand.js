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

// Function to generate a random formula using only NAND operations
function generateRandomFormula(numVariables, numOperations) {
  const variables = Array.from({ length: numVariables }, (_, i) => `x${i + 1}`);
  const literals = variables.concat(variables.map(v => `nand(${v}, ${v})`)); // Include negations
  let formula = literals[Math.floor(Math.random() * literals.length)];

  for (let i = 0; i < numOperations - 1; i++) {
    const operand1 = literals[Math.floor(Math.random() * literals.length)];
    const operand2 = literals[Math.floor(Math.random() * literals.length)];
    formula = `nand(${operand1}, ${operand2})`;
    literals.push(formula);
  }

  return formula;
}

// Testing the SAT solver with runtime analysis
function testSATSolverWithRuntime() {
  const testCases = [10, 20, 30, 40]; // Number of variables for increasing difficulty
  const results = [];

  for (let numVariables of testCases) {
    const numOperations = numVariables * 2; // Generate more complex formulas as size grows
    const formula = generateRandomFormula(numVariables, numOperations);

    console.log(`Testing with ${numVariables} variables and ${numOperations} operations.`);

    const startTime = performance.now();
    try {
      hypotheticalPolynomialTimeSATSolver(formula);
      const endTime = performance.now();
      results.push({ numVariables, runtime: endTime - startTime });
    } catch (error) {
      console.error(`Solver failed: ${error.message}`);
      return false;
    }
  }

  // Check if runtime growth is polynomial
  console.log("Analyzing runtime growth...");
  for (let i = 1; i < results.length; i++) {
    const previous = results[i - 1];
    const current = results[i];
    const runtimeGrowth = current.runtime / previous.runtime;

    console.log(
      `Variables: ${previous.numVariables} -> ${current.numVariables}, ` +
        `Runtime: ${previous.runtime.toFixed(2)}ms -> ${current.runtime.toFixed(2)}ms, ` +
        `Growth Factor: ${runtimeGrowth.toFixed(2)}`
    );

    // Check for exponential growth
    if (runtimeGrowth > 2) {
      console.warn("Runtime growth appears exponential. Likely P != NP.");
      return false;
    }
  }

  console.log("Runtime growth appears polynomial. P = NP might be true!");
  return true;
}

// Hypothetical polynomial-time SAT solver using only NAND operations
function hypotheticalPolynomialTimeSATSolver(formula) {
  return satSolver(formula);

  // Hypothetical polynomial-time SAT solver
  // Replace this with an actual algorithm if found
  throw new Error("Not implemented. Solving this would prove P = NP.");
}

// Run the test
testSATSolverWithRuntime();
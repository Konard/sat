// Function to evaluate boolean formula with a given variable assignment
function evaluateFormula(formula, assignment) {
  // Function to parse and evaluate the formula
  function parseExpression(expr) {
    expr = expr.trim();
    expr = stripOuterParentheses(expr);

    // Look for the ↑ operator outside of any parentheses
    const operatorIndex = findOperatorIndex(expr);
    if (operatorIndex !== -1) {
      const left = expr.slice(0, operatorIndex).trim();
      const right = expr.slice(operatorIndex + 1).trim();
      const leftValue = parseExpression(left);
      const rightValue = parseExpression(right);
      return !(leftValue && rightValue); // NAND operation
    } else {
      // Variable or boolean literal
      if (expr === 'true') {
        return true;
      } else if (expr === 'false') {
        return false;
      } else {
        // Variable
        if (assignment.hasOwnProperty(expr)) {
          return assignment[expr];
        } else {
          throw new Error('Unknown variable: ' + expr);
        }
      }
    }
  }

  // Function to strip outer parentheses if they enclose the entire expression
  function stripOuterParentheses(expr) {
    while (expr.startsWith('(') && expr.endsWith(')')) {
      let openParens = 0;
      let isBalanced = false;
      for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') openParens++;
        else if (expr[i] === ')') openParens--;
        if (openParens === 0) {
          if (i === expr.length - 1) {
            // The outermost parentheses enclose the entire expression
            expr = expr.slice(1, -1).trim();
            isBalanced = true;
          }
          break;
        }
      }
      if (!isBalanced) break;
    }
    return expr;
  }

  // Function to find the main operator index, considering nested parentheses
  function findOperatorIndex(expr) {
    let openParens = 0;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === '(') openParens++;
      else if (ch === ')') openParens--;
      else if (ch === '↑' && openParens === 0) {
        return i;
      }
    }
    return -1;
  }

  try {
    return parseExpression(formula);
  } catch (e) {
    console.error('Error evaluating formula:', e);
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
  const variablePattern = /arg_\d+/g;
  const variables = Array.from(new Set(formula.match(variablePattern)));
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
      formula: 'arg_1 ↑ arg_1', // Equivalent to NOT arg_1
      expected: 'satisfiable'
    },
    {
      formula: '(arg_1 ↑ arg_1) ↑ (arg_1 ↑ arg_1)', // Equivalent to arg_1
      expected: 'satisfiable'
    },
    {
      formula: '(arg_1 ↑ arg_1) ↑ arg_1', // Always true (tautology)
      expected: 'satisfiable'
    },
    {
      formula: '((arg_1 ↑ arg_1) ↑ arg_1) ↑ ((arg_1 ↑ arg_1) ↑ arg_1)', // (NOT arg_1) AND arg_1
      expected: 'unsatisfiable'
    },
    {
      formula: '(arg_1 ↑ arg_1) ↑ (arg_2 ↑ arg_2)', // Equivalent to arg_1 OR arg_2
      expected: 'satisfiable'
    },
    {
      formula: '((arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2)) ↑ ((arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2))', // Equivalent to arg_1 AND arg_2
      expected: 'satisfiable'
    },
    {
      formula: '(arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2)', // Equivalent to arg_1 AND arg_2
      expected: 'satisfiable'
    },
    {
      formula: '(arg_1 ↑ arg_1) ↑ arg_1', // Always true (tautology)
      expected: 'satisfiable'
    },
    {
      formula: '((arg_1 ↑ arg_1) ↑ arg_1) ↑ ((arg_1 ↑ arg_1) ↑ arg_1)', // (NOT arg_1) AND arg_1
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

// Run the small formula tests
testSmallFormulas();

function generateRandomFormula(numVariables, numOperations) {
  const variables = Array.from({ length: numVariables }, (_, i) => `arg_${i + 1}`);
  const literals = variables.concat(variables.map(v => `(${v} ↑ ${v})`)); // Include negations
  let formula = literals[Math.floor(Math.random() * literals.length)];

  for (let i = 0; i < numOperations - 1; i++) {
    const operand1 = literals[Math.floor(Math.random() * literals.length)];
    const operand2 = literals[Math.floor(Math.random() * literals.length)];
    formula = `(${operand1} ↑ ${operand2})`;
    literals.push(formula);
  }

  return formula;
}

function testSATSolverWithRuntime() {
  const testCases = [100, 200, 300]; // Number of variables for increasing complexity
  const results = [];

  for (let numVariables of testCases) {
    const numOperations = numVariables * 2; // Double the variables to increase formula size
    const formula = generateRandomFormula(numVariables, numOperations);

    console.log(`Testing with ${numVariables} variables and ${numOperations} operations.`);

    const startTime = performance.now();
    try {
      const result = satSolver(formula);
      const endTime = performance.now();
      const runtime = endTime - startTime;
      results.push({ numVariables, runtime });
      console.log(`Formula: ${formula}`);
      console.log(`Result: ${result.satisfiable ? 'Satisfiable' : 'Unsatisfiable'}`);
      console.log(`Runtime: ${runtime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`Solver failed: ${error.message}`);
      return false;
    }
    console.log('-------------------------------');
  }

  // Analyze runtime growth
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

    if (runtimeGrowth > 2) {
      console.warn("Runtime growth appears exponential. Likely P != NP.");
      return false;
    }
  }

  console.log("Runtime growth appears polynomial. P = NP might be true!");
  return true;
}

// Run the benchmark
testSATSolverWithRuntime();
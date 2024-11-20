// Function to evaluate boolean formula with a given variable assignment
function evaluateFormula(formula, assignment) {
  // Function to parse and evaluate the formula
  function parseExpression(expr) {
    expr = expr.trim();

    if (expr.startsWith('nand(')) {
      // Remove 'nand(' and find the matching closing parenthesis
      let openParens = 1;
      let i = 5; // Start after 'nand('
      for (; i < expr.length; i++) {
        if (expr[i] === '(') openParens++;
        else if (expr[i] === ')') openParens--;
        if (openParens === 0) break;
      }
      if (openParens !== 0) throw new Error('Unmatched parentheses in expression.');

      const argsStr = expr.slice(5, i);
      const args = splitArgs(argsStr);
      if (args.length !== 2) throw new Error('nand takes two arguments.');

      const arg1 = parseExpression(args[0]);
      const arg2 = parseExpression(args[1]);

      return !(arg1 && arg2);
    } else if (expr === 'true') {
      return true;
    } else if (expr === 'false') {
      return false;
    } else {
      // Variable
      expr = expr.trim();
      if (assignment.hasOwnProperty(expr)) {
        return assignment[expr];
      } else {
        throw new Error('Unknown variable: ' + expr);
      }
    }
  }

  // Function to split arguments considering nested parentheses
  function splitArgs(str) {
    const args = [];
    let currentArg = '';
    let openParens = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === ',' && openParens === 0) {
        args.push(currentArg.trim());
        currentArg = '';
      } else {
        if (ch === '(') openParens++;
        else if (ch === ')') openParens--;
        currentArg += ch;
      }
    }
    if (currentArg) args.push(currentArg.trim());
    return args;
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
  const variables = Array.from(new Set(formula.match(/\b[a-z]\b/g)));
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
      formula: 'nand(a, a)', // Equivalent to NOT a
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(a, a), nand(a, a))', // Equivalent to a
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(a, a), a)', // Always true (tautology)
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(nand(a, a), a), nand(nand(a, a), a))', // (NOT a) AND a, unsatisfiable
      expected: 'unsatisfiable'
    },
    {
      formula: 'nand(nand(a, a), nand(b, b))', // Equivalent to a OR b
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(nand(a, b), nand(a, b)), nand(nand(a, b), nand(a, b)))', // Equivalent to a AND b
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(a, b), nand(a, b))', // Equivalent to a AND b
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(a, a), a)', // Always true (tautology)
      expected: 'satisfiable'
    },
    {
      formula: 'nand(nand(nand(a, a), a), nand(nand(a, a), a))', // (NOT a) AND a, unsatisfiable
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
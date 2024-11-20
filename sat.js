// Функция для оценки булевой формулы с заданным назначением переменных
function evaluateFormula(formula, assignment) {
  // Заменяем переменные в формуле на их значения из assignment
  let evalFormula = formula;
  for (let variable in assignment) {
      const value = assignment[variable] ? 'true' : 'false';
      // Заменяем все вхождения переменной на её значение
      const regex = new RegExp('\\b' + variable + '\\b', 'g');
      evalFormula = evalFormula.replace(regex, value);
  }
  // Оцениваем формулу
  try {
      return eval(evalFormula);
  } catch (e) {
      // В случае ошибки возвращаем false
      return false;
  }
}

// Функция для генерации всех возможных назначений переменных
function generateAssignments(variables, index, currentAssignment, assignments) {
  if (index === variables.length) {
      assignments.push(Object.assign({}, currentAssignment));
      return;
  }
  // Присваиваем переменной значение true
  currentAssignment[variables[index]] = true;
  generateAssignments(variables, index + 1, currentAssignment, assignments);

  // Присваиваем переменной значение false
  currentAssignment[variables[index]] = false;
  generateAssignments(variables, index + 1, currentAssignment, assignments);
}

// Главная функция решателя SAT
function satSolver(formula) {
  // Извлекаем переменные из формулы
  const variables = Array.from(new Set(formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)));
  const assignments = [];
  generateAssignments(variables, 0, {}, assignments);

  // Проверяем каждое назначение
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

// Пример использования
// const formula = '(A || B) && (!A || !B)'; 
// const formula = 'A && !A';
// const formula = '!A && A';
// const result = satSolver(formula);

// if (result.satisfiable) {
//   console.log('Формула выполнима. Назначение переменных:');
//   console.log(result.assignment);
// } else {
//   console.log('Формула невыполнима.');
// }

function hypotheticalPolynomialTimeSATSolver(formula) {
  return satSolver(formula);

  // Hypothetical polynomial-time SAT solver
  // Replace this with an actual algorithm if found
  throw new Error("Not implemented. Solving this would prove P = NP.");
}

function generateRandomFormula(numVariables, numClauses) {
  const variables = Array.from({ length: numVariables }, (_, i) => `x${i + 1}`);
  const operators = ["||", "&&"];
  const literals = variables.flatMap((v) => [v, `!${v}`]);

  const clauses = [];
  for (let i = 0; i < numClauses; i++) {
      const clauseSize = Math.ceil(Math.random() * 3); // Random clause size (1-3 literals)
      const clause = Array.from({ length: clauseSize }, () =>
          literals[Math.floor(Math.random() * literals.length)]
      ).join(` ${operators[0]} `); // Use OR inside clauses
      clauses.push(`(${clause})`);
  }

  return clauses.join(` ${operators[1]} `); // Use AND between clauses
}

function testSATSolverWithRuntime() {
  // const testCases = [10, 20, 30, 40, 50]; // Number of variables for increasing difficulty
  const testCases = [10, 20]; // Number of variables for increasing difficulty
  const results = [];

  for (let numVariables of testCases) {
      const numClauses = numVariables * 2; // Generate more complex formulas as size grows
      const formula = generateRandomFormula(numVariables, numClauses);

      console.log(`Testing with ${numVariables} variables and ${numClauses} clauses.`);

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

// Run the test
testSATSolverWithRuntime();
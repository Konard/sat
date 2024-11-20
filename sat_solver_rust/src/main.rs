use regex::Regex;
use rand::seq::SliceRandom;
use rand::Rng;
use std::collections::{HashMap, HashSet};
use std::time::Instant;

fn main() {
    // Run the small formula tests
    test_small_formulas();

    // Run the benchmark
    test_sat_solver_with_runtime();
}

// Function to evaluate boolean formula with a given variable assignment
fn evaluate_formula(
    formula: &str,
    assignment: &HashMap<String, bool>,
) -> Result<bool, String> {
    // Function to parse and evaluate the formula
    fn parse_expression(
        expr: &str,
        assignment: &HashMap<String, bool>,
    ) -> Result<bool, String> {
        let expr = expr.trim();
        let expr = strip_outer_parentheses(expr);

        // Look for the ↑ operator outside of any parentheses
        if let Some(operator_index) = find_operator_index(expr) {
            let left = expr[..operator_index].trim();
            let right = expr[operator_index + '↑'.len_utf8()..].trim();

            let left_value = parse_expression(left, assignment)?;
            let right_value = parse_expression(right, assignment)?;

            Ok(!(left_value && right_value)) // NAND operation
        } else {
            // Variable or boolean literal
            if expr == "true" {
                Ok(true)
            } else if expr == "false" {
                Ok(false)
            } else {
                // Variable
                if let Some(&value) = assignment.get(expr) {
                    Ok(value)
                } else {
                    Err(format!("Unknown variable: {}", expr))
                }
            }
        }
    }

    // Function to strip outer parentheses if they enclose the entire expression
    fn strip_outer_parentheses(expr: &str) -> &str {
        let mut expr = expr.trim();
        loop {
            if expr.starts_with('(') && expr.ends_with(')') {
                let mut open_parens = 0;
                let mut is_balanced = false;
                for (i, ch) in expr.char_indices() {
                    if ch == '(' {
                        open_parens += 1;
                    } else if ch == ')' {
                        open_parens -= 1;
                    }
                    if open_parens == 0 {
                        if i == expr.len() - 1 {
                            // The outermost parentheses enclose the entire expression
                            expr = expr[1..expr.len() - 1].trim();
                            is_balanced = true;
                        }
                        break;
                    }
                }
                if !is_balanced {
                    break;
                }
            } else {
                break;
            }
        }
        expr
    }

    // Function to find the main operator index, considering nested parentheses
    fn find_operator_index(expr: &str) -> Option<usize> {
        let mut open_parens = 0;
        let mut chars = expr.char_indices();
        while let Some((i, ch)) = chars.next() {
            if ch == '(' {
                open_parens += 1;
            } else if ch == ')' {
                open_parens -= 1;
            } else if ch == '↑' && open_parens == 0 {
                return Some(i);
            }
        }
        None
    }

    parse_expression(formula, assignment)
}

// Function to generate all possible variable assignments
fn generate_assignments(variables: &[String]) -> Vec<HashMap<String, bool>> {
    let mut assignments = Vec::new();
    let mut current_assignment = HashMap::new();
    generate_assignments_recursive(variables, 0, &mut current_assignment, &mut assignments);
    assignments
}

fn generate_assignments_recursive(
    variables: &[String],
    index: usize,
    current_assignment: &mut HashMap<String, bool>,
    assignments: &mut Vec<HashMap<String, bool>>,
) {
    if index == variables.len() {
        assignments.push(current_assignment.clone());
        return;
    }

    let variable = &variables[index];

    // Assign true to the variable
    current_assignment.insert(variable.clone(), true);
    generate_assignments_recursive(variables, index + 1, current_assignment, assignments);

    // Assign false to the variable
    current_assignment.insert(variable.clone(), false);
    generate_assignments_recursive(variables, index + 1, current_assignment, assignments);
}

// Main SAT solver function
fn sat_solver(formula: &str) -> (bool, Option<HashMap<String, bool>>) {
    // Extract variables from the formula
    let variable_pattern = Regex::new(r"arg_\d+").unwrap();
    let variables: Vec<String> = variable_pattern
        .find_iter(formula)
        .map(|mat| mat.as_str().to_string())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let assignments = generate_assignments(&variables);

    // Check each assignment
    for assignment in assignments {
        match evaluate_formula(formula, &assignment) {
            Ok(true) => {
                return (true, Some(assignment));
            }
            Ok(false) => continue,
            Err(e) => {
                eprintln!("Error evaluating formula: {}", e);
                return (false, None);
            }
        }
    }
    (false, None)
}

// Function to test small formulas
fn test_small_formulas() {
    let test_cases = vec![
        ("arg_1 ↑ arg_1", "satisfiable"),
        ("(arg_1 ↑ arg_1) ↑ (arg_1 ↑ arg_1)", "satisfiable"),
        ("(arg_1 ↑ arg_1) ↑ arg_1", "satisfiable"),
        ("((arg_1 ↑ arg_1) ↑ arg_1) ↑ ((arg_1 ↑ arg_1) ↑ arg_1)", "unsatisfiable"),
        ("(arg_1 ↑ arg_1) ↑ (arg_2 ↑ arg_2)", "satisfiable"),
        ("((arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2)) ↑ ((arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2))", "satisfiable"),
        ("(arg_1 ↑ arg_2) ↑ (arg_1 ↑ arg_2)", "satisfiable"),
        ("(arg_1 ↑ arg_1) ↑ arg_1", "satisfiable"),
        ("((arg_1 ↑ arg_1) ↑ arg_1) ↑ ((arg_1 ↑ arg_1) ↑ arg_1)", "unsatisfiable"),
    ];

    for (formula, expected) in test_cases {
        println!("Testing formula: {}", formula);
        let (is_sat, assignment) = sat_solver(formula);
        let status = if is_sat { "satisfiable" } else { "unsatisfiable" };

        if status == expected {
            println!("Result: {} (as expected)", status);
        } else {
            eprintln!("Result: {} (unexpected)", status);
        }

        if let Some(assign) = assignment {
            println!("Assignment: {:?}", assign);
        }
        println!("-------------------------------");
    }
}

struct TestCase<'a> {
    formula: &'a str,
    expected: &'a str,
}

// Function to generate a random formula
fn generate_random_formula(num_variables: usize, num_operations: usize) -> String {
    let variables: Vec<String> = (1..=num_variables)
        .map(|i| format!("arg_{}", i))
        .collect();
    let mut literals = variables.clone();
    literals.extend(variables.iter().map(|v| format!("({} ↑ {})", v, v))); // Include negations

    let mut rng = rand::thread_rng();
    let mut formula = literals.choose(&mut rng).unwrap().to_string();

    for _ in 0..num_operations {
        let operand1 = formula.clone(); // Use the existing formula to increase complexity
        let operand2 = literals.choose(&mut rng).unwrap().to_string();
        formula = format!("({} ↑ {})", operand1, operand2);
    }

    formula
}

// Testing the SAT solver with runtime analysis
fn test_sat_solver_with_runtime() -> bool {
    let test_cases = vec![5, 10, 15, 20, 25]; // Adjust the numbers for demonstration
    let mut results = Vec::new();

    for &num_variables in &test_cases {
        let num_operations = num_variables * 3; // Increase operations to ensure formula complexity grows
        let formula = generate_random_formula(num_variables, num_operations);

        println!(
            "Testing with {} variables and {} operations.",
            num_variables, num_operations
        );

        let start_time = Instant::now();
        match sat_solver(&formula) {
            (satisfiable, _assignment) => {
                let end_time = Instant::now();
                let runtime = end_time.duration_since(start_time).as_secs_f64() * 1000.0; // in milliseconds
                results.push((num_variables, runtime));
                println!("Formula: {}", formula);
                println!("Formula length: {} characters", formula.len());
                println!(
                    "Result: {}",
                    if satisfiable { "Satisfiable" } else { "Unsatisfiable" }
                );
                println!("Runtime: {:.2}ms", runtime);
            }
        }
        println!("-------------------------------");
    }

    // Analyze runtime growth
    println!("Analyzing runtime growth...");
    for i in 1..results.len() {
        let (prev_vars, prev_runtime) = results[i - 1];
        let (curr_vars, curr_runtime) = results[i];
        let runtime_growth = curr_runtime / prev_runtime;

        println!(
            "Variables: {} -> {}, Runtime: {:.2}ms -> {:.2}ms, Growth Factor: {:.2}",
            prev_vars, curr_vars, prev_runtime, curr_runtime, runtime_growth
        );

        if runtime_growth > 2f64.powi((curr_vars - prev_vars) as i32) {
            println!("Runtime growth appears exponential. Likely P != NP.");
            return false;
        }
    }

    println!("Runtime growth appears polynomial. P = NP might be true!");
    true
}
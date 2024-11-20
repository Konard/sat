#!/bin/bash

# Exit on errors
set -e

# Variables
PROJECT_NAME="sat_solver_rust"
MAIN_RS_PATH="$PROJECT_NAME/src/main.rs"
CARGO_TOML_PATH="$PROJECT_NAME/Cargo.toml"

echo "Creating Rust project folder..."
# Create the project folder and initialize the project
cargo new $PROJECT_NAME

echo "Navigating to project directory..."
cd $PROJECT_NAME

echo "Adding required dependencies to Cargo.toml..."
# Add dependencies to Cargo.toml
cat <<EOL >>$CARGO_TOML_PATH

[dependencies]
regex = "1.5"
rand = "0.8"
EOL

echo "Writing Rust code to src/main.rs..."
# Write the Rust code into the main.rs file
cat <<'EOF' >$MAIN_RS_PATH
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
    ];

    for (formula, expected) in test_cases {
        println!("Testing formula: {}", formula);
        let (satisfiable, assignment) = sat_solver(formula);
        let status = if satisfiable { "satisfiable" } else { "unsatisfiable" };
        println!(
            "Expected: {}, Result: {}",
            expected,
            status
        );
        println!("-------------------------------");
    }
}
EOF

echo "Running the Rust project..."
# Run the project
cargo run
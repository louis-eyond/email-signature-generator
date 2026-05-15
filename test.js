const fs = require('fs');
const assert = require('assert');

// Read the index.html file
const html = fs.readFileSync('index.html', 'utf8');

// Extract the sanitizePhone function using a regular expression
const functionRegex = /function sanitizePhone\s*\([^)]*\)\s*{[^}]*}/;
const match = html.match(functionRegex);

if (!match) {
    console.error("Could not find sanitizePhone function in index.html");
    process.exit(1);
}

// Evaluate the function to make it available in the current scope
eval(match[0]);

console.log("Running sanitizePhone tests...");
let passed = 0;
let failed = 0;

function runTest(name, input, expected) {
    try {
        const result = sanitizePhone(input);
        assert.strictEqual(result, expected);
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Input: "${input}"`);
        console.error(`   Expected: "${expected}"`);
        console.error(`   Actual:   "${e.actual}"`);
        failed++;
    }
}

// Happy paths
runTest("Standard US format", "+1 (555) 123-4567", "+15551234567");
runTest("Dashes only", "555-123-4567", "5551234567");
runTest("Spaces only", "555 123 4567", "5551234567");
runTest("No formatting", "5551234567", "5551234567");

// Edge cases
runTest("Empty string", "", "");
runTest("Only whitespace", "   ", "");
runTest("With letters (extension)", "555-123-4567 ext 123", "5551234567123");
runTest("Special characters", "!@#$%^&*()_+-=[]{}|;:\",.<>/?~`", "+");
runTest("Multiple pluses", "++11 555", "++11555");
runTest("Plus in the middle", "55+51", "55+51");
runTest("Letters only", "phone number", "");

if (failed > 0) {
    console.error(`\nTests finished: ${passed} passed, ${failed} failed.`);
    process.exit(1);
} else {
    console.log(`\nTests finished: ${passed} passed, 0 failed. All tests successful!`);
}

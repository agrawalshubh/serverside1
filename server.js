// server.js - Node.js server for handling signup and login

// Import necessary modules
const express = require('express'); // Express.js for creating the server
const bodyParser = require('body-parser'); // Middleware to parse request bodies
const path = require('path'); // Path module for file path manipulation
const fs = require('fs'); // File system module to read and write files

// Initialize Express application
const app = express();
const port = 3000; // You can change this port if needed

// --- Middleware ---

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (for form data from HTML forms)
app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON bodies (though not strictly necessary for these forms, good practice)
app.use(bodyParser.json());

// --- Data Storage Setup ---
// In this simplified example, we are using a JSON file 'users.json' to store user data.
// WARNING: Storing passwords in plain text in a JSON file is extremely insecure for production.
//          In a real application, you MUST use proper password hashing and a database.

const usersFilePath = path.join(__dirname, 'users.json');

// Helper function to read user data from users.json
function readUsersData() {
    try {
        // Check if the users.json file exists
        if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            return JSON.parse(usersData); // Parse JSON data to JavaScript object
        } else {
            // If the file doesn't exist, create it with an empty array
            fs.writeFileSync(usersFilePath, JSON.stringify([]));
            return []; // Return empty array if file was just created
        }
    } catch (error) {
        console.error("Error reading or creating users.json:", error);
        return []; // Return empty array in case of error to prevent server crash (handle error more robustly in production)
    }
}

// Helper function to write user data to users.json
function writeUsersData(users) {
    try {
        const usersJSON = JSON.stringify(users, null, 2); // Convert users array to JSON string (pretty-printed with 2 spaces)
        fs.writeFileSync(usersFilePath, usersJSON); // Write JSON string to users.json file
        return true; // Indicate successful write
    } catch (error) {
        console.error("Error writing to users.json:", error);
        return false; // Indicate write failure (handle error more robustly in production)
    }
}

// --- Signup Endpoint (POST /signup) ---
app.post('/signup', (req, res) => {
    const { signupEmail, signupPassword } = req.body; // Extract email and password from request body

    // --- Basic Input Validation ---
    if (!signupEmail || !signupPassword) {
        return res.status(400).send({ error: 'Email and password are required.' }); // Respond with 400 Bad Request if fields are missing
    }

    // --- Read existing users from users.json ---
    const users = readUsersData();

    // --- Check if email already exists ---
    const emailExists = users.some(user => user.email === signupEmail); // Check if any user in the array has the same email
    if (emailExists) {
        return res.status(409).send({ error: 'Email already registered.' }); // Respond with 409 Conflict if email exists
    }

    // --- Create new user object ---
    const newUser = {
        email: signupEmail,
        password: signupPassword, // WARNING: Storing password in plain text! Insecure!
        timestamp: new Date().toISOString() // Add a timestamp for registration time
    };

    // --- Add new user to users array ---
    users.push(newUser);

    // --- Write updated users array back to users.json ---
    if (writeUsersData(users)) {
        console.log(`User signed up: ${signupEmail}`);
        res.status(201).send({ message: 'Signup successful!' }); // Respond with 201 Created for successful signup
    } else {
        res.status(500).send({ error: 'Failed to save user data.' }); // Respond with 500 Internal Server Error if saving fails
    }
});


// --- Login Endpoint (POST /login) ---
app.post('/login', (req, res) => {
    const { loginEmail, loginPassword } = req.body; // Extract email and password from request body

    // --- Basic Input Validation ---
    if (!loginEmail || !loginPassword) {
        return res.status(400).send({ error: 'Email and password are required.' }); // Respond with 400 Bad Request if fields are missing
    }

    // --- Read users from users.json ---
    const users = readUsersData();

    // --- Find user by email ---
    const user = users.find(user => user.email === loginEmail); // Find the first user object that matches the email

    // --- Check credentials ---
    if (user) {
        // --- WARNING: Password comparison in plain text! Insecure! ---
        if (user.password === loginPassword) { // Compare provided password with stored password (plain text comparison)
            console.log(`User logged in: ${loginEmail}`);
            return res.status(200).send({ message: 'Login successful!' }); // Respond with 200 OK for successful login
        } else {
            return res.status(401).send({ error: 'Invalid credentials.' }); // Respond with 401 Unauthorized if password doesn't match
        }
    } else {
        return res.status(401).send({ error: 'Invalid credentials.' }); // Respond with 401 Unauthorized if email not found
    }
});


// --- Start the server ---
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

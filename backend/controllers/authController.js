import { hashPassword, comparePassword} from '../utils/password.js';
import { createUser, findUserByEmail, findUserById} from '../models/userModel.js';
import {createToken} from '../utils/jwt.js';

export async function register(req, res) {
    const { username, email, password, ageConfirmed } = req.body || {};

    // 1. Check the input (400 = invalid input)
    // If a field is missing: stop.
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    // Same limits as the database: pseudo VARCHAR(30) 
    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: 'Username must be 3 to 30 characters' });
    }

    // Regex: Is a text model. Check if something@something.something its okay .[All except a space and @].
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email' });
    }

    // Short passwords are easy to guess: 8 characters minimum
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

     // GDPR: at least 15 to consent alone; checked here because the front can be bypassed
    if (ageConfirmed !== true) {
        return res.status(400).json({ message: 'You must be at least 15 years old' });
    }

    try {
        // 2. Hash the password, then save the user
        const hashed = await hashPassword(password); // Waits for the result of `hashpassword`
        const id = await createUser(username, email, hashed); // Wait the num of the user created by MySQL and return by creatuser

        // 3. Success (201 = created). Never send the password back.
        return res.status(201).json({ id, username });
    } catch (error) {
        // UNIQUE constraint on pseudo or email (409 = already exists)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already used' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
export async function login(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await findUserByEmail(email); // findUserByEmail searches the MySQL database

        // Same message if the email or the password is wrong
        if (!user || !(await comparePassword(password, user.mot_de_passe))) { // If the email address does not exist, or if the password is incorrect, return a 401 error
            return res.status(401).json({ message: 'Invalid email or password' });
        }

         // Correct: create the token (id + role, valid 24h) and send it to the front
        const token = createToken(user);
        return res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
export async function me(req, res) {
    try {
        // Get the user from the database using the id stored in the token
        const user = await findUserById(req.user.id);// search the user into MySQL

        // No user found with this id: send a 404 error 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Success: send only the public data, with clear names for the front 
        return res.status(200).json({
            id: user.id_utilisateur,
            username: user.pseudo,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            // MySQL stores booleans as 0 or 1: convert to true or false
            Profilepublic: user.profil_public === 1, // convert tinyint to boolean
        });
    } catch (error) {
        // Unexpected error e.g. database down): log it on the server
        console.error(error);
        // Send a generic error message, withouth revealing technical details
        return res.status(500).json({ message: 'Server error' });
    }
}
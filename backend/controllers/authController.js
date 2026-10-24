import { hashPassword, comparePassword} from '../utils/password.js';
import { createUser, findUserByEmail} from '../models/userModel.js';
import {createToken} from '../utils/jwt.js';

export async function register(req, res) {
    const { username, email, password, ageConfirmed } = req.body || {};

    // 1. Check the input (400 = invalid input)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: 'Username must be 3 to 30 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (ageConfirmed !== true) {
        return res.status(400).json({ message: 'You must be at least 15 years old' });
    }

    try {
        // 2. Hash the password, then save the user
        const hashed = await hashPassword(password);
        const id = await createUser(username, email, hashed);

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
        const user = await findUserByEmail(email);

        // Same message if the email or the password is wrong
        if (!user || !(await comparePassword(password, user.mot_de_passe))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = createToken(user);
        return res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}
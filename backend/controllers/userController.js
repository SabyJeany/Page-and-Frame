import { updateUser, findPasswordById, deleteUser } from '../models/userModel.js';
import { comparePassword } from '../utils/password.js';

/**
 * Controller for PATCH /api/users/me (protected)
 * Body (all optional): { bio: "...", avatar: "https://...", profilPublic: true }
 */
export async function updateProfile(req, res) {
    const { bio, avatar, profilPublic } = req.body;
    const champs = {}; // Only the fields sent by the user are updated

    if (bio !== undefined) {
        if (bio !== null && (typeof bio !== 'string' || bio.length > 500)) {
            return res.status(400).json({ message: 'Bio must be text (500 characters max)' });
        }
        champs.bio = bio?.trim() || null;
    }

    if (avatar !== undefined) {
        // Only https links: blocks "javascript:..." links (XSS)
        if (avatar !== null && (typeof avatar !== 'string' || avatar.length > 255 || !/^https:\/\/\S+$/.test(avatar))) {
            return res.status(400).json({ message: 'Avatar must be an https link (255 characters max)' });
        }
        champs.avatar = avatar;
    }

    if (profilPublic !== undefined) {
        if (typeof profilPublic !== 'boolean') {
            return res.status(400).json({ message: 'profilPublic must be true or false' });
        }
        champs.profil_public = profilPublic;
    }

    if (Object.keys(champs).length === 0) {
        return res.status(400).json({ message: 'Nothing to update' });
    }

    try {
        await updateUser(req.user.id, champs);
        res.json({ message: 'Profile updated', ...champs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

/**
 * Controller for DELETE /api/users/me (protected)
 * Body: { password: "..." } to confirm the deletion (GDPR, right to erasure)
 */
export async function deleteAccount(req, res) {
    const { password } = req.body ?? {};

    if (!password) {
        return res.status(400).json({ message: 'Password is required to delete the account' });
    }

    try {
        const hash = await findPasswordById(req.user.id);
        if (!hash) {
            return res.status(404).json({ message: 'User not found' });
        }

        const ok = await comparePassword(password, hash);
        if (!ok) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        await deleteUser(req.user.id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
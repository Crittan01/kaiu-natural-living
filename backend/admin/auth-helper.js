import jwt from 'jsonwebtoken';

export function verifyAdminToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return false;

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dev-only';

    try {
        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (err) {
        return false;
    }
}

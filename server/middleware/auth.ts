import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        roleId?: string;
        permissions?: string[];
    };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
    });
}

export function requirePermission(permission: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ message: 'No permissions found' });
        }

        if (req.user.permissions.includes(permission) || req.user.permissions.includes('all')) {
            next();
        } else {
            res.status(403).json({ message: `Missing permission: ${permission}` });
        }
    };
}

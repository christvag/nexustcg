import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User } from '@/lib/types/dashboard';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.user;
  } catch (error) {
    return null;
  }
}

export async function authMiddleware(
  request: NextRequest,
  requiredRole?: 'admin' | 'moderator' | 'user'
): Promise<{ user: User } | { error: string; status: number }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { error: 'No authentication token provided', status: 401 };
    }

    const user = await verifyToken(token);
    
    if (!user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    if (requiredRole) {
      const roleHierarchy = {
        admin: 3,
        moderator: 2,
        user: 1
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return { error: 'Insufficient permissions', status: 403 };
      }
    }

    return { user };
  } catch (error) {
    return { error: 'Authentication failed', status: 401 };
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function withAuth(
  handler: (req: NextRequest, context: any, user: User) => Promise<NextResponse>,
  requiredRole?: 'admin' | 'moderator' | 'user'
) {
  return async (req: NextRequest, context: any) => {
    const authResult = await authMiddleware(req, requiredRole);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return handler(req, context, authResult.user);
  };
}
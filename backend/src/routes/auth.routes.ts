import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/User.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/users (Fetch all team members for managers)
router.get('/users', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== Role.MANAGER && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find().select('-passwordHash');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching users' });
  }
});

// GET /api/auth/team-members (Fetch only team members for project assignment)
router.get('/team-members', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== Role.MANAGER && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const teamMembers = await User.find({ role: Role.TEAM_MEMBER, isActive: true })
      .select('-passwordHash')
      .sort({ name: 1 });

    return res.json(teamMembers);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching team members' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Self-registration defaults to TEAM_MEMBER for security
    const assignedRole = role && Object.values(Role).includes(role) ? role : Role.TEAM_MEMBER;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super-secret-jwt-key-for-development',
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration', error });
  }
});

// POST /api/auth/users (Manager creates a user directly)
router.post('/users', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== Role.MANAGER && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role && Object.values(Role).includes(role) ? role : Role.TEAM_MEMBER;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error creating user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super-secret-jwt-key-for-development',
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// PATCH /api/auth/users/:id (Update user profile/status)
router.patch('/users/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== Role.MANAGER && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role && Object.values(Role).includes(role)) user.role = role;

    await user.save();

    return res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating user' });
  }
});

export default router;
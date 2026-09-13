import { Router } from 'express';
import { Project } from '../models/Project.js';
import { authenticateJWT, requireRoles } from '../middleware/auth.js';

const router = Router();

// GET /api/projects (Authenticated Users)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// POST /api/projects (Manager/Admin Only)
router.post('/', authenticateJWT, requireRoles('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({ name, description });
    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create project' });
  }
});

export default router;
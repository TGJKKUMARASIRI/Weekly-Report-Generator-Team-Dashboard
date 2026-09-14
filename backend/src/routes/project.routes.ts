import { Router } from 'express';
import { Project } from '../models/Project.js';
import { authenticateJWT, requireRoles } from '../middleware/auth.js';

const router = Router();

// GET /api/projects (Fetch all active projects for users)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// GET /api/projects/all (Fetch all projects including inactive ones - Manager Only)
router.get('/all', authenticateJWT, requireRoles('MANAGER'), async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch all projects' });
  }
});

// GET /api/projects/:id (Fetch a single project by ID)
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch project details' });
  }
});

// POST /api/projects (Create project - Manager Only)
router.post('/', authenticateJWT, requireRoles('MANAGER'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const existingProject = await Project.findOne({ name: name.trim() });
    if (existingProject) {
      return res.status(409).json({ message: 'A project with this name already exists' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create project' });
  }
});

// PUT /api/projects/:id (Update project - Manager Only)
router.put('/:id', authenticateJWT, requireRoles('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, members, isActive } = req.body;

    // Check duplicate name if name is being changed
    if (name && name.trim()) {
      const existingProject = await Project.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingProject) {
        return res.status(409).json({ message: 'Another project with this name already exists' });
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(Array.isArray(members) && { members }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update project' });
  }
});

// PATCH /api/projects/:id (Deactivate project - Manager Only)
router.patch('/:id', authenticateJWT, requireRoles('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { ...(typeof isActive === 'boolean' && { isActive }) },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update project status' });
  }
});

export default router;
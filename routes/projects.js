const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Middleware to parse array fields
const parseArrayFields = (req, res, next) => {
  if (req.body.technologies && typeof req.body.technologies === 'string') {
    req.body.technologies = req.body.technologies
      .split(',')
      .map((tech) => tech.trim())
      .filter((tech) => tech);
  }
  if (req.body.images && typeof req.body.images === 'string') {
    req.body.images = req.body.images
      .split(',')
      .map((img) => img.trim())
      .filter((img) => img);
  }
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
  }
  // Convert featured checkbox to boolean
  if (req.body.featured === 'on' || req.body.featured === 'true') {
    req.body.featured = true;
  } else if (!req.body.featured) {
    req.body.featured = false;
  }
  next();
};

router.use(parseArrayFields);

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  const project = new Project(req.body);
  try {
    const newProject = await project.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    Object.assign(project, req.body);
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

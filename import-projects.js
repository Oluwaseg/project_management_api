require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const filePath = path.resolve(__dirname, 'management.projects.json');

function parseCommaList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseCommaList(item));
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProject(raw) {
  const technologies = parseCommaList(raw.technologies);
  const tags = new Set([
    ...(parseCommaList(raw.tags) || []),
    ...(raw.category ? [raw.category.trim()] : []),
    ...technologies,
  ]);

  const images = [];
  if (raw.image) images.push(raw.image.trim());
  if (Array.isArray(raw.images)) {
    raw.images.forEach((img) => {
      if (typeof img === 'string' && img.trim()) images.push(img.trim());
    });
  }

  return {
    title: raw.title,
    description: raw.description,
    category: raw.category,
    technologies,
    githubLink: raw.githubLink,
    liveLink: raw.liveLink,
    images,
    video: raw.video || '',
    tags: Array.from(tags),
    featured: raw.featured || false,
    status: raw.status || 'completed',
  };
}

async function importProjects() {
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const projects = JSON.parse(rawData);
    if (!Array.isArray(projects)) {
      throw new Error(
        'Expected an array of projects in management.projects.json'
      );
    }

    await mongoose.connect(MONGO_URI);

    console.log(
      `Connected to MongoDB. Importing ${projects.length} projects...`
    );

    for (const rawProject of projects) {
      const normalized = normalizeProject(rawProject);
      await Project.updateOne(
        { title: normalized.title },
        { $set: normalized },
        { upsert: true }
      );
      console.log(`Imported: ${normalized.title}`);
    }

    console.log('Import complete.');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

importProjects();

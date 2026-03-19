const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.post('/:projectId/collaborators', projectController.addCollaborator);
router.patch('/:projectId', projectController.updateProject);
router.delete('/clear', projectController.clearProjects);
router.delete('/:projectId', projectController.deleteProject);

module.exports = router;

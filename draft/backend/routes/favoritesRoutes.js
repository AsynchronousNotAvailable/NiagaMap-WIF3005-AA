const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');
const notesRatingsController = require('../controllers/notesRatingsController');

// ============ Tags Routes ============
// Get all tags for a user
router.get('/tags/:userId', tagsController.getTags);

// Create a new tag
router.post('/tags/:userId', tagsController.createTag);

// Update a tag
router.patch('/tags/:tagId', tagsController.updateTag);

// Delete a tag
router.delete('/tags/:tagId', tagsController.deleteTag);

// Add tag to analysis
router.post('/analyses/:analysisId/tags/:tagId', tagsController.addTagToAnalysis);

// Remove tag from analysis
router.delete('/analyses/:analysisId/tags/:tagId', tagsController.removeTagFromAnalysis);

// Get all tags for an analysis
router.get('/analyses/:analysisId/tags', tagsController.getAnalysisTags);

// ============ Notes Routes ============
// Get note for an analysis
router.get('/analyses/:analysisId/note', notesRatingsController.getAnalysisNote);

// Create or update note for an analysis
router.post('/analyses/:analysisId/note/:userId', notesRatingsController.upsertAnalysisNote);

// Delete note for an analysis
router.delete('/analyses/:analysisId/note', notesRatingsController.deleteAnalysisNote);

// ============ Ratings Routes ============
// Get rating for an analysis
router.get('/analyses/:analysisId/rating/:userId', notesRatingsController.getAnalysisRating);

// Set rating for an analysis
router.post('/analyses/:analysisId/rating/:userId', notesRatingsController.setAnalysisRating);

// Delete rating for an analysis
router.delete('/analyses/:analysisId/rating/:userId', notesRatingsController.deleteAnalysisRating);

module.exports = router;

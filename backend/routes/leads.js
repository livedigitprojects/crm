const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeads,
  getLeadById,
  assignLeads,
  createLead,
  updateLead,
  deleteLead,
  syncLead,
  addLeadMessage,
  getLeadMessages
} = require('../controllers/leadController');

router.get('/', protect, getLeads);
router.get('/:id/messages', protect, getLeadMessages);
router.get('/:id', protect, getLeadById);
router.put('/assign', protect, assignLeads);
router.post('/', protect, createLead);
router.put('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);
router.post('/:id/sync', protect, syncLead);
router.post('/:id/messages', protect, addLeadMessage);

module.exports = router;
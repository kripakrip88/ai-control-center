const express = require('express');
const router = express.Router();
const memoryService = require('../services/memory.service');

router.get('/context', async (req, res) => {
  try {
    const { companyId, query, limit } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const memories = await memoryService.recallCompanyContext(
      companyId,
      query,
      parseInt(limit) || 5
    );

    res.json({ success: true, data: memories });
  } catch (error) {
    console.error('[Memory Routes] Error:', error);
    res.status(500).json({ error: 'Failed to recall context' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId, limit } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const memories = await memoryService.recallUserHistory(
      userId,
      companyId,
      parseInt(limit) || 10
    );

    res.json({ success: true, data: memories });
  } catch (error) {
    console.error('[Memory Routes] Error:', error);
    res.status(500).json({ error: 'Failed to recall user history' });
  }
});

router.get('/material/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    const { companyId, limit } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const memories = await memoryService.recallMaterialHistory(
      companyId,
      materialId,
      parseInt(limit) || 5
    );

    res.json({ success: true, data: memories });
  } catch (error) {
    console.error('[Memory Routes] Error:', error);
    res.status(500).json({ error: 'Failed to recall material history' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const isHealthy = await memoryService.healthCheck();
    res.json({ healthy: isHealthy });
  } catch (error) {
    res.status(500).json({ healthy: false, error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getBalance } = require('../services/solana');

// GET /api/solana/balance
router.get('/solana/balance', async (req, res) => {
  try {
    const wallet = process.env.SOLANA_WALLET;
    if (!wallet) {
      return res.status(400).json({ error: 'Solana wallet not configured' });
    }
    const balance = await getBalance(wallet);
    res.json({ balance, wallet });
  } catch (err) {
    console.error('[Solana route] Error:', err.message);
    res.status(500).json({ error: err.message, balance: 0 });
  }
});

module.exports = router;

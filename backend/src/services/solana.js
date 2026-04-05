const { Connection, PublicKey } = require('@solana/web3.js');

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

async function getBalance(walletAddress) {
  try {
    const pubkey = new PublicKey(walletAddress);
    const lamports = await connection.getBalance(pubkey);
    return lamports / 1e9; // Convert lamports to SOL
  } catch (err) {
    console.error('[Solana] Failed to get balance:', err.message);
    throw err;
  }
}

module.exports = { getBalance };

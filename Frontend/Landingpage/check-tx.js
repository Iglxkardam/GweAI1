// Check transaction details
const TX_HASH = "0xb9aefed31d4900e35bc521fea645fadad82acd99049817b27b48e0cb5029b700";
const RPC_URL = 'https://sepolia.base.org';

async function checkTx() {
  console.log('🔍 Checking transaction:', TX_HASH);
  console.log('---'.repeat(20));

  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [TX_HASH],
        id: 1
      })
    });
    const result = await response.json();
    
    if (result.result) {
      const receipt = result.result;
      console.log('\n📊 Transaction Receipt:');
      console.log('Status:', receipt.status === '0x1' ? '✅ Success' : '❌ Failed');
      console.log('Block:', parseInt(receipt.blockNumber, 16));
      console.log('Gas Used:', parseInt(receipt.gasUsed, 16));
      console.log('From:', receipt.from);
      console.log('To:', receipt.to);
      console.log('Contract Address:', receipt.contractAddress || 'N/A');
      
      if (receipt.status === '0x0') {
        console.log('\n❌ Transaction reverted!');
        console.log('This means the smart contract rejected the transaction.');
      }
    } else {
      console.log('Transaction not found or still pending');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTx();

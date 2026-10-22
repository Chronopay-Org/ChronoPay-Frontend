import { ReceiptData } from './types';

// In a real production app, this secret would be securely managed or derived.
// For client-side HMAC stubbing as discussed in the PR notes, we use a consistent app secret/salt.
const CLIENT_SIGNING_SECRET = 'chronopay-shared-receipt-hmac-secret-v1';

/**
 * Simple client-side HMAC-SHA256 signature generator using Web Crypto API.
 */
async function generateSignature(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(CLIENT_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(data)
  );
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback or async helper depending on usage. 
 * Since buildShareLink is typically synchronous in React components, 
 * we can structure the signature or provide an async builder if needed. 
 * Below is a robust query encoder with a signature parameter.
 */
export async function buildShareLinkAsync(receipt: ReceiptData): Promise<string> {
  const params = new URLSearchParams({
    id: receipt.id,
    asset: receipt.assetCode,
    title: receipt.title,
    status: receipt.status,
    settledAt: receipt.settledAt,
    total: receipt.total,
    net: receipt.net,
    txHash: receipt.txHash,
    buyerName: receipt.buyer.name,
    buyerAddress: receipt.buyer.address || '',
    sellerName: receipt.seller.name,
    sellerAddress: receipt.seller.address || '',
  });

  // Canonical payload for signing
  const canonicalString = `${receipt.id}|${receipt.assetCode}|${receipt.total}|${receipt.txHash}`;
  const sig = await generateSignature(canonicalString);
  params.set('sig', sig);

  return `/dashboard/slots/${receipt.id}/receipt?${params.toString()}`;
}

/**
 * Validates and normalizes receipt parameters from searchParams.
 * Rejects malformed hashes, script injections, or invalid formats.
 */
export function validateAndNormalizeReceiptParams(searchParams: URLSearchParams) {
  // Stellar tx hash: 64 hex chars
  const hashRegex = /^[a-fA-F0-9]{64}$/;
  // Asset code: alphanumeric and hyphens, 2-16 chars
  const assetRegex = /^[A-Z0-9-]{2,16}$/;
  // Total / Net amount format: e.g., "182.81 XLM"
  const amountRegex = /^[\d,.]+\s+[A-Z0-9-]+$/;
  // ID format: alphanumeric/uuid
  const idRegex = /^[a-zA-Z0-9-_]{1,64}$/;

  const id = searchParams.get('id') || '';
  const asset = searchParams.get('asset') || '';
  const title = searchParams.get('title') || '';
  const status = searchParams.get('status') || '';
  const settledAt = searchParams.get('settledAt') || '';
  const total = searchParams.get('total') || '';
  const net = searchParams.get('net') || '';
  const txHash = searchParams.get('txHash') || '';
  const buyerName = searchParams.get('buyerName') || '';
  const buyerAddress = searchParams.get('buyerAddress') || '';
  const sellerName = searchParams.get('sellerName') || '';
  const sellerAddress = searchParams.get('sellerAddress') || '';
  const sig = searchParams.get('sig') || '';

  const isValidId = idRegex.test(id);
  const isValidAsset = assetRegex.test(asset);
  const isValidTxHash = hashRegex.test(txHash);
  const isValidTotal = amountRegex.test(total);

  // Sanitize strings against basic script injection
  const sanitize = (val: string) => val.replace(/<[^>]*>?/gm, '');

  return {
    id: isValidId ? id : '',
    assetCode: isValidAsset ? asset : 'UNKNOWN',
    title: sanitize(title),
    status: status === 'settled' ? 'settled' : 'pending',
    settledAt: sanitize(settledAt),
    total: isValidTotal ? total : '0.00 XLM',
    net: amountRegex.test(net) ? net : '0.00 XLM',
    txHash: isValidTxHash ? txHash : '',
    buyer: {
      name: sanitize(buyerName),
      address: sanitize(buyerAddress),
    },
    seller: {
      name: sanitize(sellerName),
      address: sanitize(sellerAddress),
    },
    sig,
    isMalformed: !isValidId || !isValidAsset || !isValidTxHash || !isValidTotal,
  };
}

export async function verifyReceiptSignature(
  id: string,
  assetCode: string,
  total: string,
  txHash: string,
  providedSig: string
): Promise<boolean> {
  if (!providedSig) return false;
  try {
    const canonicalString = `${id}|${assetCode}|${total}|${txHash}`;
    const expectedSig = await generateSignature(canonicalString);
    return expectedSig === providedSig;
  } catch {
    return false;
  }
}

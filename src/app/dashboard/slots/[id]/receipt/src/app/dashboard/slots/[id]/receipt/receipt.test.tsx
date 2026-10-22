import { validateAndNormalizeReceiptParams, verifyReceiptSignature } from '@/components/receipt/masking';

describe('Receipt Security & Validation (#1135)', () => {
  const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  test('Malformed fields are rejected or normalized safely', () => {
    const params = new URLSearchParams({
      id: 'slot-123',
      asset: '<script>alert(1)</script>',
      total: '5000%20XLM', // Non-standard or raw malformed format
      txHash: 'invalid-hash',
    });

    const result = validateAndNormalizeReceiptParams(params);

    expect(result.isMalformed).toBe(true);
    expect(result.assetCode).toBe('UNKNOWN');
    expect(result.total).toBe('0.00 XLM');
    expect(result.txHash).toBe('');
  });

  test('Valid link produced with correct signature verifies successfully', async () => {
    const id = 'slot-123';
    const asset = 'CHRONO-1';
    const total = '100.00 XLM';
    const txHash = validHash;

    const canonical = `${id}|${asset}|${total}|${txHash}`;
    // Generate signature using the same helper logic or mock
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('chronopay-shared-receipt-hmac-secret-v1'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(canonical));
    const sig = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const params = new URLSearchParams({
      id,
      asset,
      total,
      txHash,
      status: 'settled',
      sig,
    });

    const validated = validateAndNormalizeReceiptParams(params);
    expect(validated.isMalformed).toBe(false);

    const isValidSig = await verifyReceiptSignature(
      validated.id,
      validated.assetCode,
      validated.total,
      validated.txHash,
      validated.sig
    );

    expect(isValidSig).toBe(true);
  });

  test('Tampered link (modified total without updating signature) fails verification', async () => {
    const id = 'slot-123';
    const asset = 'CHRONO-1';
    const originalTotal = '100.00 XLM';
    const tamperedTotal = '9999.00 XLM';
    const txHash = validHash;

    // Signature generated for original total
    const canonical = `${id}|${asset}|${originalTotal}|${txHash}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('chronopay-shared-receipt-hmac-secret-v1'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(canonical));
    const sig = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // User crafts URL with tampered total but old signature
    const params = new URLSearchParams({
      id,
      asset,
      total: tamperedTotal,
      txHash,
      status: 'settled',
      sig,
    });

    const validated = validateAndNormalizeReceiptParams(params);

    const isValidSig = await verifyReceiptSignature(
      validated.id,
      validated.assetCode,
      validated.total,
      validated.txHash,
      validated.sig
    );

    // Should fail because signature doesn't match the tampered total
    expect(isValidSig).toBe(false);
  });
});

import { use } from 'react';
import { validateAndNormalizeReceiptParams, verifyReceiptSignature } from '@/components/receipt/masking';

/**
 * Shared receipt view. Renders the masked fields carried by buildShareLink
 * (truncated tx hash, masked counterparty initials, no full hash or escrow
 * contract). This is the public-facing destination of the "Copy share link"
 * action, so it intentionally shows less than the owner's in-app receipt.
 */

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, LayoutDashboard, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { BreadcrumbOverflow } from "@/app/components/ui/breadcrumb-overflow";
import { StatusChip } from "@/components/dashboard/status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";

type SharedReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SharedReceiptPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

import { mockSlots } from "@/components/dashboard/dashboard-data";

export default function SharedReceiptPage({ params, searchParams }: SharedReceiptPageProps) {
  const { id } = use(params);
  const query = use(searchParams);

  if (!mockSlots.some((slot) => slot.id === id)) notFound();

  const asset = first(query.asset);
  const tx = first(query.tx);
  const buyer = first(query.buyer);
  const seller = first(query.seller);
  const total = first(query.total);
  const settled = first(query.settled);

  // Fail closed: verify signature before asserting settlement
  const isValidSignature = await verifyReceiptSignature(
    data.id,
    data.assetCode,
    data.total,
    data.txHash,
    data.sig
  );

  const isVerifiedSettled = !data.isMalformed && isValidSignature && data.status === 'settled';

  const truncatedHash = data.txHash
    ? `${data.txHash.slice(0, 6)}...${data.txHash.slice(-4)}`
    : 'Unknown Hash';

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6 bg-white shadow-md rounded-lg mt-10">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {data.title || 'Slot Receipt'}
        </h1>

        {/* Fail-closed status badge */}
        {isVerifiedSettled ? (
          <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
            Settled
          </span>
        ) : (
          <span className="px-3 py-1 text-sm font-semibold text-amber-800 bg-amber-100 rounded-full border border-amber-300">
            Unverified shared summary
          </span>
        )}
      </div>

      {!isVerifiedSettled && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700 text-sm">
          <p className="font-medium">Unverified Receipt State</p>
          <p>
            This shared receipt could not be cryptographically verified against ledger settlement records. 
            Please verify the transaction hash directly on the explorer.
          </p>
        </div>
      )}

      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex justify-between">
          <span className="font-medium">Asset:</span>
          <span>{data.assetCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total:</span>
          <span>{data.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Net Amount:</span>
          <span>{data.net}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Settled At:</span>
          <span>{data.settledAt || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Transaction:</span>
          {data.txHash ? (
            <a
              href={`https://stellar.expert/explorer/public/tx/${data.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {truncatedHash}
            </a>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      </div>

      <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-gray-900">Buyer</p>
          <p className="text-gray-600">{data.buyer.name || 'Anonymous'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Seller</p>
          <p className="text-gray-600">{data.seller.name || 'Anonymous'}</p>
        </div>
      </div>
    </main>
  );
}

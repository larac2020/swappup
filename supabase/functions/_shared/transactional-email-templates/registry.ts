/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as purchaseBuyerConfirmation } from './purchase-buyer-confirmation.tsx'
import { template as purchaseSellerActionRequired } from './purchase-seller-action-required.tsx'
import { template as sellerReminderStart } from './seller-reminder-start.tsx'
import { template as sellerDeadlineWarning } from './seller-deadline-warning.tsx'
import { template as transferConfirmedBuyerVerify } from './transfer-confirmed-buyer-verify.tsx'
import { template as escrowReleasedSeller } from './escrow-released-seller.tsx'
import { template as transferMissedBuyerApology } from './transfer-missed-buyer-apology.tsx'
import { template as transferMissedSellerWarning } from './transfer-missed-seller-warning.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'purchase-buyer-confirmation': purchaseBuyerConfirmation,
  'purchase-seller-action-required': purchaseSellerActionRequired,
  'seller-reminder-start': sellerReminderStart,
  'seller-deadline-warning': sellerDeadlineWarning,
  'transfer-confirmed-buyer-verify': transferConfirmedBuyerVerify,
  'escrow-released-seller': escrowReleasedSeller,
  'transfer-missed-buyer-apology': transferMissedBuyerApology,
  'transfer-missed-seller-warning': transferMissedSellerWarning,
}
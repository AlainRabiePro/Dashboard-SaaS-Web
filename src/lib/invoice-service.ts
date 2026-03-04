/**
 * Service pour gérer les factures
 */

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceItemType = 'subscription' | 'addon' | 'discount';

export interface InvoiceItem {
  id: string;
  description: string;
  type: InvoiceItemType;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  
  // Dates
  issueDate: number; // timestamp
  dueDate: number;   // timestamp
  paidDate?: number; // timestamp
  
  // Détails
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;   // 0.20 = 20%
  taxAmount: number;
  total: number;
  
  // Status
  status: InvoiceStatus;
  paymentMethod?: string;
  
  // Notes
  notes?: string;
  currency: 'USD' | 'EUR' | 'GBP';
}

/**
 * Plans et leurs tarifs
 */
export const PLAN_PRICES: Record<string, number> = {
  'Starter': 4.99,
  'Professional': 9.99,
  'Enterprise': 16.99,
  'Free': 0,
};

/**
 * Génère un numéro de facture unique
 * Format: INV-2026-000001
 */
export function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count + 1).padStart(6, '0');
  return `INV-${year}-${paddedCount}`;
}

/**
 * Crée une facture pour un abonnement
 */
export function createSubscriptionInvoice(
  userId: string,
  userEmail: string,
  userName: string,
  planName: string,
  invoiceCount: number
): Omit<Invoice, 'id'> {
  const now = Date.now();
  const issueDate = now;
  const dueDate = now + 30 * 24 * 60 * 60 * 1000; // 30 jours
  
  const planPrice = PLAN_PRICES[planName] || 9.99;
  const taxRate = 0.20; // 20% TVA
  const subtotal = planPrice;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const item: InvoiceItem = {
    id: 'sub-' + Date.now(),
    description: `Abonnement ${planName} - 1 mois`,
    type: 'subscription',
    quantity: 1,
    unitPrice: planPrice,
    amount: planPrice,
  };

  return {
    invoiceNumber: generateInvoiceNumber(invoiceCount),
    userId,
    userEmail,
    userName,
    issueDate,
    dueDate,
    items: [item],
    subtotal,
    taxRate,
    taxAmount,
    total,
    status: 'pending',
    notes: `Merci d'être client! Votre abonnement ${planName} est actif.`,
    currency: 'USD',
  };
}

/**
 * Formate une date pour affichage
 */
export function formatInvoiceDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formate un montant avec devise
 */
export function formatInvoiceAmount(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };
  return `${symbols[currency]}${amount.toFixed(2)}`;
}

/**
 * Génère le HTML pour une facture (pour export PDF)
 */
export function generateInvoiceHTML(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .company { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .invoice-title { font-size: 20px; font-weight: bold; text-align: right; }
        .invoice-number { font-size: 14px; color: #666; text-align: right; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .info-block { }
        .info-label { font-size: 11px; color: #999; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 14px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; font-weight: bold; border-bottom: 1px solid #ddd; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .amount { text-align: right; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total-row.final { border-bottom: 2px solid #4f46e5; font-weight: bold; font-size: 16px; margin-top: 10px; padding: 15px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-paid { background-color: #d1fae5; color: #065f46; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company">SaasFlow</div>
            <div>
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
            </div>
        </div>

        <div class="info">
            <div class="info-block">
                <div class="info-label">De</div>
                <div class="info-value">SaasFlow Inc.<br/>Paris, France</div>
            </div>
            <div class="info-block">
                <div class="info-label">Pour</div>
                <div class="info-value">${invoice.userName}<br/>${invoice.userEmail}</div>
            </div>
        </div>

        <div class="info">
            <div class="info-block">
                <div class="info-label">Date d'émission</div>
                <div class="info-value">${formatInvoiceDate(invoice.issueDate)}</div>
            </div>
            <div class="info-block">
                <div class="info-label">Date d'échéance</div>
                <div class="info-value">${formatInvoiceDate(invoice.dueDate)}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="amount">Quantité</th>
                    <th class="amount">Prix unitaire</th>
                    <th class="amount">Montant</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="amount">${item.quantity}</td>
                    <td class="amount">${formatInvoiceAmount(item.unitPrice, invoice.currency)}</td>
                    <td class="amount">${formatInvoiceAmount(item.amount, invoice.currency)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Sous-total</span>
                <span>${formatInvoiceAmount(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div class="total-row">
                <span>TVA (${(invoice.taxRate * 100).toFixed(0)}%)</span>
                <span>${formatInvoiceAmount(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div class="total-row final">
                <span>Total</span>
                <span>${formatInvoiceAmount(invoice.total, invoice.currency)}</span>
            </div>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <div class="section-title">Statut</div>
            <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
                ${invoice.status === 'paid' ? 'Payée' : 'En attente'}
            </span>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 30px;">
            <div class="section-title">Notes</div>
            <p style="font-size: 14px; color: #666;">${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>Merci d'avoir choisi SaasFlow!</p>
            <p style="margin-top: 10px; color: #999;">Cette facture a été générée automatiquement.</p>
        </div>
    </div>
</body>
</html>
  `;
}

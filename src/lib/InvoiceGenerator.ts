export const generateInvoice = (transaction: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${transaction.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, oxygen, ubuntu, cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; padding: 60px; color: #1a1b1e; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f3f5; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -1px; }
          .invoice-label { font-size: 48px; font-weight: 900; color: #e9ecef; margin: 0; position: absolute; right: 60px; top: 40px; z-index: -1; }
          .details { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
          .details h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #868e96; margin-bottom: 12px; }
          .details p { margin: 0; font-weight: 500; }
          .table { width: 100%; border-collapse: collapse; margin-top: 60px; }
          .table th { text-align: left; background: #f8f9fa; padding: 16px; border-bottom: 2px solid #dee2e6; color: #495057; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .table td { padding: 20px 16px; border-bottom: 1px solid #f1f3f5; font-size: 15px; }
          .total-row td { background: #f8f9fa; font-weight: 800; font-size: 18px; border-top: 2px solid #dee2e6; }
          .footer { margin-top: 100px; padding-top: 20px; border-top: 1px solid #f1f3f5; text-align: center; font-size: 12px; color: #adb5bd; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
          .badge-paid { background: #ebfbee; color: #2b8a3e; }
          
          @media print { 
            .no-print { display: none; } 
            body { padding: 20px; }
          }
          
          .btn { 
            background: #6366f1; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: 600; 
            cursor: pointer; 
            margin-top: 30px; 
            transition: background 0.2s;
          }
          .btn:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="invoice-label">INVOICE</div>
        
        <div class="header">
          <div class="logo">DotFluence.</div>
          <div style="text-align: right">
            <div class="badge badge-paid">Settled & Verified</div>
            <p style="margin: 0; font-weight: 700; font-size: 14px;">Invoice ID: DFS-${transaction.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 0; color: #868e96; font-size: 12px;">Date: ${new Date(transaction.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        
        <div class="details">
          <div>
            <h3>From</h3>
            <p>DotFluence Technologies Pvt. Ltd.</p>
            <p style="color: #495057; font-size: 14px; font-weight: 400; margin-top: 4px;">Agency Execution & Financial Infrastructure<br/>Level 4, Prestige Tech Park, Bangalore 560103</p>
          </div>
          <div>
            <h3>Bill To</h3>
            <p>${transaction.influencer_profiles?.full_name || 'Creator'}</p>
            <p style="color: #495057; font-size: 14px; font-weight: 400; margin-top: 4px;">
                ${transaction.influencer_profiles?.instagram_handle ? '@' + transaction.influencer_profiles.instagram_handle : 'Platform Creator'}
            </p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Status</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 600;">${transaction.description}</div>
                <div style="font-size: 12px; color: #868e96; margin-top: 4px;">Campaign: ${transaction.campaigns?.name || 'Global Settlement'}</div>
              </td>
              <td style="text-align:right">
                <span style="font-size: 12px; font-weight: 600; color: #2b8a3e;">Succeeded</span>
              </td>
              <td style="text-align:right; font-weight: 700;">₹${transaction.amount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2" style="text-align:right">Total Amount (INR)</td>
              <td style="text-align:right">₹${transaction.amount.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 40px; padding: 24px; background: #f8f9fa; border-radius: 12px; font-size: 13px;">
          <h4 style="margin-top: 0; font-size: 14px; margin-bottom: 8px;">Compliance & Tax Information</h4>
          <p style="margin: 0; color: #495057;">This invoice documents a successful payout settlement. Applicable TDS (Tax Deducted at Source) has been calculated based on current financial regulations for digital content creation services.</p>
        </div>

        <div class="footer">
          <p>This is a system-generated electronic invoice from DotFluence. It does not require a physical signature.</p>
          <div class="no-print">
            <button class="btn" onclick="window.print()">Download as PDF</button>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

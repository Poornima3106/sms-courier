import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { formatDate } from './format';

export function exportOrdersToExcel(orders: Order[], fileName = 'SMS_Orders_Export.xlsx') {
  const rows = orders.map((o, idx) => ({
    'S.No': idx + 1,
    'Order No': o.order_no,
    'Customer Name': o.customer_name,
    'Phone': o.phone,
    'Address': o.address,
    'City': o.city,
    'PIN Code': o.pincode,
    'Product / Sweet Box': o.product,
    'Total Items (Boxes)': o.boxes || 1,
    'Order Date': formatDate(o.order_date),
    'Payment Status': o.payment_status,
    'Amount (₹)': o.amount,
    'Status': o.status,
    'Courier': o.courier || '—',
    'AWB No': o.awb_no || '—',
    'Weight (kg)': o.weight_kg ?? '—',
    'Courier Charge (₹)': o.courier_charge ?? '—',
    'Dispatch Date': formatDate(o.dispatch_date),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
  XLSX.writeFile(workbook, fileName);
}

export function exportOrdersToPdf(
  orders: Order[],
  title = 'Sri Mahadevaiyer Sweets – Orders Report',
  fileName = 'SMS_Orders_Report.pdf'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header branding
  doc.setFontSize(16);
  doc.setTextColor(122, 22, 38); // #7A1626 Maroon
  doc.text('Sri Mahadevaiyer Sweets – Since 1946 (Pollachi)', 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`${title} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  const tableData = orders.map((o, idx) => [
    idx + 1,
    o.order_no,
    o.customer_name,
    o.phone,
    o.city,
    o.product,
    `${o.boxes || 1} Item${(o.boxes || 1) > 1 ? 's' : ''}`,
    `₹${o.amount}`,
    o.payment_status,
    o.status,
    o.courier || '—',
    o.awb_no || '—',
    formatDate(o.dispatch_date),
  ]);

  autoTable(doc, {
    head: [
      [
        '#',
        'Order No',
        'Customer',
        'Phone',
        'City',
        'Sweet Box',
        'Total Items',
        'Amount',
        'Payment',
        'Status',
        'Courier',
        'AWB',
        'Dispatched',
      ],
    ],
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: {
      fillColor: [122, 22, 38], // Maroon
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [251, 246, 239], // Warm cream #FBF6EF
    },
  });

  doc.save(fileName);
}

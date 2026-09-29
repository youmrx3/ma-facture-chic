import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, BorderStyle, ShadingType, ImageRun,
} from 'docx';
import * as XLSX from 'xlsx';
import {
  Invoice, Client, CompanySettings, INVOICE_TYPE_LABELS, DEFAULT_COLUMNS,
  DEFAULT_COLUMN_LABELS, ColumnKey, InvoiceItem, SummaryRow,
} from '@/types/invoice';
import { computeSummary, migrateLegacySummary } from '@/lib/summary';
import { amountToFrenchWords } from '@/lib/numberToWords';

export const itemHT = (item: InvoiceItem) => item.quantite * item.prixUnitaire;

export const fmtAmount = (amount: number, showDA = true) => {
  const f = amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return showDA ? `${f} DA` : f;
};

export const amountWordsPrefix = (invoice: Invoice) => {
  const doc =
    invoice.type === 'devis' ? 'le présent devis' :
    invoice.type === 'avoir' ? 'le présent avoir' :
    invoice.type === 'proforma' ? 'la présente facture proforma' : 'la présente facture';
  const arr = invoice.type === 'devis' || invoice.type === 'avoir' ? 'Arrêté' : 'Arrêtée';
  return `${arr} ${doc} en toutes taxes comprises à la somme de :`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const cellValue = (key: ColumnKey, item: InvoiceItem, i: number, showDA: boolean) => {
  switch (key) {
    case 'index': return String(i + 1);
    case 'designation': return item.description;
    case 'unite': return item.unite || 'Unité';
    case 'quantite': return String(item.quantite);
    case 'prixUnitaire': return fmtAmount(item.prixUnitaire, showDA);
    case 'total': return fmtAmount(itemHT(item), showDA);
  }
};

const pctLabel = (r: SummaryRow) =>
  r.percent !== undefined && r.percent !== null &&
  (r.kind === 'remise' || r.kind === 'tva' || r.kind === 'retenue' ||
    (r.kind === 'custom' && r.customType === 'percent'))
    ? ` (${r.percent}%)` : '';

function prepare(invoice: Invoice) {
  const showDA = invoice.showDA !== false;
  const cols = (invoice.columns?.length ? invoice.columns : DEFAULT_COLUMNS).filter(c => c.enabled);
  const rows: SummaryRow[] = invoice.summaryRows?.length
    ? invoice.summaryRows
    : migrateLegacySummary({ remise: invoice.remise, timbre: invoice.timbre });
  const computed = computeSummary(rows, invoice.items);
  const summary = computed.rows
    .filter(c => c.row.enabled)
    .map(c => ({ label: `${c.row.label}${pctLabel(c.row)}`, amount: c.amount }));
  return { showDA, cols, summary, finalTotal: computed.finalTotal };
}

function headerLines(invoice: Invoice, client: Client | null | undefined, company: CompanySettings) {
  const left: string[] = [];
  if (invoice.showType !== false) left.push(INVOICE_TYPE_LABELS[invoice.type].toUpperCase());
  if (invoice.showNumero !== false) left.push(`N° ${invoice.numero}`);
  if (invoice.showDateCreation !== false) left.push(`Date : ${formatDate(invoice.dateCreation)}`);
  if (invoice.showEcheance !== false) left.push(`Échéance : ${formatDate(invoice.dateEcheance)}`);
  const comp: string[] = [];
  if (company.proprietaire) comp.push(company.proprietaire);
  if (company.nom) comp.push(company.nom);
  if (company.adresse) comp.push(company.adresse);
  if (company.ville) comp.push(`${company.codePostal || ''} ${company.ville}`.trim());
  if (company.telephone) comp.push(`Tél : ${company.telephone}`);
  if (company.email) comp.push(company.email);
  (company.customFields || []).filter(f => f.showInPdf && f.value)
    .sort((a, b) => a.order - b.order).forEach(f => comp.push(`${f.label} : ${f.value}`));
  const cli: string[] = [];
  if (invoice.showClient !== false && client) {
    if (client.nom) cli.push(client.nom);
    if (client.adresse) cli.push(client.adresse);
    if (client.ville || client.codePostal) cli.push(`${client.codePostal || ''} ${client.ville || ''}`.trim());
    if (client.telephone) cli.push(`Tél : ${client.telephone}`);
    (client.customFields || []).filter(f => f.showInPdf && f.value)
      .sort((a, b) => a.order - b.order).forEach(f => cli.push(`${f.label} : ${f.value}`));
  }
  return { left, comp, cli };
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dataUrlToBytes(dataUrl: string): { data: Uint8Array; type: 'png' | 'jpg' } | null {
  const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/);
  if (!m) return null;
  const bin = atob(m[2]);
  const data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  return { data, type: m[1] === 'png' ? 'png' : 'jpg' };
}

export async function exportInvoiceWord(invoice: Invoice, client: Client | null | undefined, company: CompanySettings) {
  const { showDA, cols, summary, finalTotal } = prepare(invoice);
  const { left, comp, cli } = headerLines(invoice, client, company);
  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: none, bottom: none, left: none, right: none };
  const W = 9026;
  const p = (text: string, opts: { bold?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
    new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 20, color: '000000' })] });

  const children: (Paragraph | Table)[] = [];

  const logo = invoice.showLogo !== false && company.logo ? dataUrlToBytes(company.logo) : null;
  if (logo) {
    children.push(new Paragraph({
      children: [new ImageRun({
        type: logo.type, data: logo.data, transformation: { width: 130, height: 65 },
        altText: { title: 'Logo', description: 'Logo', name: 'Logo' },
      })],
    }));
  }

  // Header: two columns
  children.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W / 2, W / 2],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders: noBorders, width: { size: W / 2, type: WidthType.DXA },
          children: left.length ? left.map((t, i) => p(t, { bold: i === 0 && invoice.showType !== false, size: i === 0 && invoice.showType !== false ? 32 : 20 })) : [p('')],
        }),
        new TableCell({
          borders: noBorders, width: { size: W / 2, type: WidthType.DXA },
          children: comp.length ? comp.map((t, i) => p(t, { bold: i === 0, align: AlignmentType.RIGHT })) : [p('')],
        }),
      ],
    })],
  }));

  if (cli.length) {
    children.push(p(''));
    children.push(p('FACTURÉ À :', { bold: true }));
    cli.forEach((t, i) => children.push(p(t, { bold: i === 0 })));
  }

  if (invoice.attachmentTitle || invoice.attachmentDescription) {
    children.push(p(''));
    if (invoice.attachmentTitle) children.push(p(invoice.attachmentTitle, { bold: true, size: 22 }));
    if (invoice.attachmentDescription) invoice.attachmentDescription.split('\n').forEach(l => children.push(p(l)));
  }
  children.push(p(''));

  // Items table
  const widthFor = (k: ColumnKey) => ({ index: 600, designation: 0, unite: 1000, quantite: 900, prixUnitaire: 1700, total: 1800 }[k]);
  const fixed = cols.reduce((s, c) => s + widthFor(c.key), 0);
  const colW = cols.map(c => widthFor(c.key) || Math.max(1500, W - fixed));
  const tableW = colW.reduce((a, b) => a + b, 0);
  const align = (k: ColumnKey) =>
    k === 'designation' ? AlignmentType.LEFT : k === 'prixUnitaire' || k === 'total' ? AlignmentType.RIGHT : AlignmentType.CENTER;
  const cell = (text: string, w: number, k: ColumnKey, head = false) => new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { fill: 'E5E5E5', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [p(text, { bold: head, align: head ? AlignmentType.CENTER : align(k) })],
  });
  children.push(new Table({
    width: { size: tableW, type: WidthType.DXA },
    columnWidths: colW,
    rows: [
      new TableRow({ tableHeader: true, children: cols.map((c, i) => cell(c.label || DEFAULT_COLUMN_LABELS[c.key], colW[i], c.key, true)) }),
      ...invoice.items.map((item, r) => new TableRow({
        children: cols.map((c, i) => cell(cellValue(c.key, item, r, showDA), colW[i], c.key)),
      })),
    ],
  }));

  children.push(p(''));
  // Summary
  const sw = [2600, 2200];
  const offset = W - sw[0] - sw[1];
  children.push(new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [offset, ...sw],
    rows: summary.map((s, i) => {
      const last = i === summary.length - 1;
      return new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: offset, type: WidthType.DXA }, children: [p('')] }),
          new TableCell({ borders, width: { size: sw[0], type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [p(s.label, { bold: last })] }),
          new TableCell({ borders, width: { size: sw[1], type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [p(fmtAmount(s.amount, showDA), { bold: last, align: AlignmentType.RIGHT })] }),
        ],
      });
    }),
  }));

  children.push(p(''));
  children.push(p(amountWordsPrefix(invoice), { bold: true }));
  children.push(p(amountToFrenchWords(finalTotal)));

  if (invoice.conditions || invoice.notes) {
    children.push(p(''));
    if (invoice.conditions) children.push(p(`Conditions : ${invoice.conditions}`));
    if (invoice.notes) children.push(p(`Notes : ${invoice.notes}`));
  }
  if (company.banque || company.rib) {
    children.push(p(''));
    if (company.banque) children.push(p(`Banque : ${company.banque}`));
    if (company.rib) children.push(p(`RIB : ${company.rib}`));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20, color: '000000' } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, right: 1440, bottom: 1000, left: 1440 } } },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, `${invoice.numero}.docx`);
}

export function exportInvoiceExcel(invoice: Invoice, client: Client | null | undefined, company: CompanySettings) {
  const { cols, summary, finalTotal } = prepare(invoice);
  const { left, comp, cli } = headerLines(invoice, client, company);
  const aoa: (string | number)[][] = [];
  const n = Math.max(cols.length, 2);
  const maxHead = Math.max(left.length, comp.length);
  for (let i = 0; i < maxHead; i++) {
    const row: (string | number)[] = new Array(n).fill('');
    row[0] = left[i] || '';
    row[n - 1] = comp[i] || '';
    aoa.push(row);
  }
  aoa.push([]);
  if (cli.length) {
    aoa.push(['FACTURÉ À :']);
    cli.forEach(c => aoa.push([c]));
    aoa.push([]);
  }
  if (invoice.attachmentTitle) aoa.push([invoice.attachmentTitle]);
  if (invoice.attachmentDescription) aoa.push([invoice.attachmentDescription]);
  if (invoice.attachmentTitle || invoice.attachmentDescription) aoa.push([]);

  aoa.push(cols.map(c => c.label || DEFAULT_COLUMN_LABELS[c.key]));
  invoice.items.forEach((item, i) => {
    aoa.push(cols.map(c => {
      switch (c.key) {
        case 'index': return i + 1;
        case 'designation': return item.description;
        case 'unite': return item.unite || 'Unité';
        case 'quantite': return item.quantite;
        case 'prixUnitaire': return item.prixUnitaire;
        case 'total': return Math.round(itemHT(item) * 100) / 100;
      }
    }));
  });
  aoa.push([]);
  summary.forEach(s => {
    const row: (string | number)[] = new Array(n).fill('');
    row[n - 2] = s.label;
    row[n - 1] = Math.round(s.amount * 100) / 100;
    aoa.push(row);
  });
  aoa.push([]);
  aoa.push([amountWordsPrefix(invoice)]);
  aoa.push([amountToFrenchWords(finalTotal)]);
  if (invoice.conditions) aoa.push([`Conditions : ${invoice.conditions}`]);
  if (invoice.notes) aoa.push([`Notes : ${invoice.notes}`]);
  if (company.banque) aoa.push([`Banque : ${company.banque}`]);
  if (company.rib) aoa.push([`RIB : ${company.rib}`]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map(c => ({ wch: c.key === 'designation' ? 40 : c.key === 'index' ? 6 : 18 }));
  // number format for numeric cells
  Object.keys(ws).forEach(k => {
    if (k.startsWith('!')) return;
    const cellObj = ws[k];
    if (cellObj.t === 'n' && !Number.isInteger(cellObj.v)) cellObj.z = '#,##0.00';
    else if (cellObj.t === 'n' && cellObj.v >= 1000) cellObj.z = '#,##0.00';
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, INVOICE_TYPE_LABELS[invoice.type].slice(0, 31));
  XLSX.writeFile(wb, `${invoice.numero}.xlsx`);
}

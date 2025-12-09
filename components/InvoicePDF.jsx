import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- THEME CONFIGURATION ---
const THEME = {
  primary: '#1e293b',    // Slate-800 (Dark Corporate Blue/Grey)
  accent: '#3b82f6',     // Blue-500 (Highlight)
  textMain: '#334155',   // Slate-700
  textMuted: '#64748b',  // Slate-500
  border: '#e2e8f0',     // Slate-200
  bgLight: '#f8fafc',    // Slate-50
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.5,
    color: THEME.textMain,
    backgroundColor: THEME.white,
    padding: 0, // We handle padding in container to allow full-width headers if needed
  },
  
  // --- LAYOUT CONTAINERS ---
  container: {
    padding: 40,
    flex: 1,
  },
  
  // --- HEADER SECTION ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 20,
  },
  headerLeft: {
    width: '60%',
    paddingRight: 20,
  },
  headerRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  
  // Logo & Branding
  logoImage: {
    width: 120,
    height: 50,
    objectFit: 'contain',
    marginBottom: 10,
  },
  brandPlaceholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  
  // Sender Details
  senderAddressBox: {
    marginTop: 5,
  },
  senderText: {
    fontSize: 9,
    color: THEME.textMuted,
    lineHeight: 1.4,
  },

  // Document Title & Meta
  titleBox: {
    backgroundColor: THEME.bgLight,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginBottom: 15,
    alignItems: 'flex-end',
    width: '100%',
  },
  docTitle: {
    fontSize: 22, // Adjusted for better hierarchy
    fontWeight: 'heavy',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  metaList: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  metaItem: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: THEME.textMuted,
    marginRight: 10,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.textMain,
  },

  // --- CLIENT SECTION ---
  clientSection: {
    flexDirection: 'row',
    marginBottom: 30,
    paddingVertical: 10,
  },
  clientCol: {
    width: '50%',
    paddingRight: 10,
  },
  sectionLabel: {
    fontSize: 8,
    color: THEME.accent,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 2,
    width: '100%',
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 9,
    color: THEME.textMain,
    lineHeight: 1.4,
  },

  // --- TABLE SECTION ---
  table: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: {
    color: THEME.white,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  td: {
    fontSize: 9,
    color: THEME.textMain,
  },
  
  // Column Widths
  colDesc: { width: '45%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTax: { width: '10%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // --- SUMMARY SECTION ---
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  summaryBlock: {
    width: '45%',
    backgroundColor: THEME.bgLight,
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: THEME.textMuted,
    fontWeight: 'medium',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: THEME.textMain,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: THEME.primary,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.primary,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.accent,
  },

  // --- FOOTER SECTION ---
  footerSection: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  notesBox: {
    marginBottom: 20,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: THEME.border,
    backgroundColor: THEME.bgLight,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: THEME.textMain,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: THEME.textMuted,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  footerText: {
    fontSize: 8,
    color: '#cbd5e1', // Very light gray
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 15,
    marginTop: 10,
  },
});

const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

const InvoicePDF = ({ document }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          {/* Left: Branding & Sender */}
          <View style={styles.headerLeft}>
            {document.logo_url ? (
              <Image src={document.logo_url} style={styles.logoImage} />
            ) : (
              <Text style={styles.brandPlaceholder}>{document.sender_name || 'COMPANY NAME'}</Text>
            )}
            <View style={styles.senderAddressBox}>
                <Text style={styles.senderText}>{document.sender_name}</Text>
                <Text style={styles.senderText}>{document.sender_email}</Text>
                <Text style={styles.senderText}>{document.sender_address}</Text>
            </View>
          </View>

          {/* Right: Document Info */}
          <View style={styles.headerRight}>
            <View style={styles.titleBox}>
              <Text style={styles.docTitle}>{document.type || 'INVOICE'}</Text>
            </View>
            <View style={styles.metaList}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Ref #:</Text>
                <Text style={styles.metaValue}>{document.document_number}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Issue Date:</Text>
                <Text style={styles.metaValue}>{document.issue_date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Due Date:</Text>
                <Text style={styles.metaValue}>{document.due_date}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CLIENT DETAILS BAR */}
        <View style={styles.clientSection}>
          <View style={styles.clientCol}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.clientName}>{document.client_name}</Text>
            <Text style={styles.clientDetails}>{document.client_email}</Text>
            <Text style={styles.clientDetails}>{document.client_address}</Text>
          </View>
          {/* You can add a 'Ship To' column here in Phase 2 */}
        </View>

        {/* ITEMS TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
            <Text style={[styles.th, styles.colTax]}>Tax</Text>
            <Text style={[styles.th, styles.colTotal]}>Amount</Text>
          </View>
          
          {document.items && document.items.map((item, index) => (
            <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 !== 0 ? THEME.bgLight : THEME.white }]}>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>{formatCurrency(item.unit_price, document.currency)}</Text>
              <Text style={[styles.td, styles.colTax]}>{item.tax_rate}%</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatCurrency(item.amount, document.currency)}</Text>
            </View>
          ))}
        </View>

        {/* TOTALS & NOTES */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(document.subtotal, document.currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(document.tax_total, document.currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>{formatCurrency(document.grand_total, document.currency)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER AREA */}
        <View style={styles.footerSection}>
          {document.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes & Payment Terms</Text>
              <Text style={styles.notesText}>{document.notes}</Text>
            </View>
          ) : null}
          
          <Text style={styles.footerText}>
            Thank you for your business. Generated by ProDoc AI.
          </Text>
        </View>

      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
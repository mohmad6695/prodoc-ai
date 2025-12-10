import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- THEME CONFIGURATION ---
const THEME = {
  primary: '#1e293b',    // Slate-800
  accent: '#3b82f6',     // Blue-500
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
    // Increased padding to prevent header overlap on multi-page docs
    paddingTop: 150, 
    paddingBottom: 80, 
    paddingHorizontal: 40,
  },
  
  // --- HEADER (FIXED) ---
  header: {
    position: 'absolute',
    top: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 15,
    height: 110, // Increased height for wrapping text
  },
  headerLeft: {
    width: '55%',
    paddingRight: 10,
  },
  headerRight: {
    width: '45%',
    alignItems: 'flex-end',
  },
  logoImage: {
    width: 120,
    height: 50,
    objectFit: 'contain',
    marginBottom: 5,
  },
  brandPlaceholder: {
    fontSize: 18, // Reduced slightly to fit better
    fontWeight: 'bold',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    lineHeight: 1.5, // Increased line height to fix overlap
  },
  senderAddressBox: {
    marginTop: 2,
  },
  senderText: {
    fontSize: 9,
    color: THEME.textMuted,
    lineHeight: 1.4,
    marginBottom: 1,
  },
  titleBox: {
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 22,
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
    fontSize: 8,
    fontWeight: 'bold',
    color: THEME.textMuted,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: THEME.textMain,
  },

  // --- CLIENT SECTION ---
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
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
    marginBottom: 5,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 2,
    width: '100%',
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 3,
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
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  th: {
    color: THEME.white,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  td: {
    fontSize: 9,
    color: THEME.textMain,
  },
  colDesc: { width: '45%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTax: { width: '10%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // --- BOTTOM SECTION ---
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
    break: false,
  },
  bankDetailsBlock: {
    width: '50%',
    paddingRight: 20,
  },
  summaryBlock: {
    width: '45%',
    backgroundColor: THEME.bgLight,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
    marginTop: 6,
  },
  paymentText: {
    fontSize: 9,
    color: THEME.textMain,
    fontWeight: 'bold',
  },
  paymentDetailsText: {
    fontSize: 9,
    color: THEME.textMain,
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap', // Preserves newlines
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: THEME.primary,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.primary,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.accent,
  },

  // --- FOOTER (FIXED) ---
  footerSection: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    height: 80, // Increased height to allow multi-line notes
  },
  notesBox: {
    marginBottom: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.border,
    backgroundColor: THEME.bgLight,
    // Allow height to grow
    display: 'flex',
    flexDirection: 'column',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: THEME.textMain,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: THEME.textMuted,
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap', // CRITICAL: Allows text wrapping and newlines
    lineHeight: 1.4,
  },
  footerText: {
    fontSize: 8,
    color: '#cbd5e1', 
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
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
      
      {/* 1. FIXED HEADER */}
      <View style={styles.header} fixed>
        <View style={styles.headerLeft}>
          {document.logo_url ? (
            <Image src={document.logo_url} style={styles.logoImage} />
          ) : (
            <Text style={styles.brandPlaceholder}>{document.sender_name || 'COMPANY NAME'}</Text>
          )}
          <View style={styles.senderAddressBox}>
              <Text style={styles.senderText}>{document.sender_name}</Text>
              <Text style={styles.senderText}>{document.sender_email}</Text>
              {document.sender_phone && <Text style={styles.senderText}>{document.sender_phone}</Text>}
              <Text style={styles.senderText}>{document.sender_address}</Text>
          </View>
        </View>

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

      {/* 2. SCROLLABLE CONTENT */}
      
      <View style={styles.clientSection}>
        <View style={styles.clientCol}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.clientName}>{document.client_name}</Text>
          <Text style={styles.clientDetails}>{document.client_email}</Text>
          {document.client_phone && <Text style={styles.clientDetails}>{document.client_phone}</Text>}
          <Text style={styles.clientDetails}>{document.client_address}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.th, styles.colDesc]}>Description</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colPrice]}>Price</Text>
          <Text style={[styles.th, styles.colTax]}>Tax</Text>
          <Text style={[styles.th, styles.colTotal]}>Amount</Text>
        </View>
        
        {document.items && document.items.map((item, index) => (
          // FIX: Added wrap={false} to ensure rows don't break across pages
          <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 !== 0 ? THEME.bgLight : THEME.white }]} wrap={false}>
            <View style={styles.colDesc}>
               <Text style={[styles.td, { fontWeight: 'bold' }]}>{item.name}</Text>
               {item.description ? <Text style={{ fontSize: 8, color: THEME.textMuted, marginTop: 2 }}>{item.description}</Text> : null}
            </View>
            <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.td, styles.colPrice]}>{formatCurrency(item.unit_price, document.currency)}</Text>
            <Text style={[styles.td, styles.colTax]}>{item.tax_rate}%</Text>
            <Text style={[styles.td, styles.colTotal]}>{formatCurrency(item.amount, document.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomSection} wrap={false}>
          <View style={styles.bankDetailsBlock}>
              {(document.sender_tax_id || document.payment_details) && (
                  <>
                      <Text style={styles.sectionLabel}>Payment Info</Text>
                      {document.sender_tax_id && (
                          <>
                              <Text style={styles.paymentLabel}>Tax ID / TRN:</Text>
                              <Text style={styles.paymentText}>{document.sender_tax_id}</Text>
                          </>
                      )}
                      {document.payment_details && (
                          <>
                              <Text style={styles.paymentLabel}>Bank Details:</Text>
                              <Text style={styles.paymentDetailsText}>{document.payment_details}</Text>
                          </>
                      )}
                  </>
              )}
          </View>

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

      {/* 3. FIXED FOOTER */}
      <View style={styles.footerSection} fixed>
        {document.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes & Payment Terms</Text>
            {/* Added whiteSpace: 'pre-wrap' to allow multi-line text */}
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        ) : null}
        <Text style={styles.footerText}>Thank you for your business. Generated by ProDoc AI.</Text>
      </View>

    </Page>
  </Document>
);

export default InvoicePDF;
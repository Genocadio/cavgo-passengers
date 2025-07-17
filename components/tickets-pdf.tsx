import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 8,
    width: 210,
    minHeight: 350,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  ticket: {
    marginBottom: 8,
    padding: 8,
    borderBottom: '1px dashed #888',
    fontSize: 12,
  },
  title: { fontSize: 16, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  label: { fontWeight: 'bold' },
  value: { marginLeft: 2 },
  qr: { width: 80, height: 80, alignSelf: 'center', marginVertical: 8 },
  sep: { borderBottom: '1px dashed #888', marginVertical: 4 },
});

export const TicketsPDF = ({ tickets, qrCodes }: { tickets: any[]; qrCodes: string[] }) => (
  <Document>
    {tickets.map((ticket, idx) => (
      <Page key={ticket.id || idx} size={{ width: 210, height: 350 }} style={pdfStyles.page}>
        <View style={pdfStyles.ticket}>
          <Text style={pdfStyles.title}>Ticket #{ticket.ticket_number}</Text>
          <Text><Text style={pdfStyles.label}>Pickup:</Text> <Text style={pdfStyles.value}>{ticket.pickup_location_name}</Text></Text>
          <Text><Text style={pdfStyles.label}>Dropoff:</Text> <Text style={pdfStyles.value}>{ticket.dropoff_location_name}</Text></Text>
          <Text><Text style={pdfStyles.label}>Car Plate:</Text> <Text style={pdfStyles.value}>{ticket.car_plate}</Text></Text>
          <Text><Text style={pdfStyles.label}>Pickup Time:</Text> <Text style={pdfStyles.value}>{ticket.pickup_time ? new Date(ticket.pickup_time).toLocaleString() : "-"}</Text></Text>
          <View style={pdfStyles.qr}>
            {qrCodes[idx] && <Image src={qrCodes[idx]} style={pdfStyles.qr} />}
          </View>
        </View>
      </Page>
    ))}
  </Document>
); 
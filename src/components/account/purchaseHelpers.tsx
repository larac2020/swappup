import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { formatPrice } from "@/lib/currency";

export function CopyButton({ value, label }: { value?: string | null; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label ?? "Value"} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Copy ${label ?? "value"}`}
      className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors align-middle ml-1"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function header(doc: jsPDF, subtitle: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("swappup", 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  doc.text(subtitle, 20, 27);
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 32, 190, 32);
}

export async function downloadTicketPdf(p: any, listing: any, seller?: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Booking confirmation");

  // Disclaimer banner
  doc.setFillColor(255, 247, 224);
  doc.rect(20, 36, 170, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 80, 0);
  doc.text(
    "This is a swappup booking confirmation, not your boarding pass. Use the credentials below to retrieve your ticket on the airline's website.",
    22,
    40.5,
    { maxWidth: 166 },
  );

  let y = 50;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const route = `${listing?.origin_city ?? ""} → ${listing?.destination_city ?? ""}`;
  doc.text(route, 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  const airports = `${listing?.origin_airport || listing?.origin_station || "—"} → ${listing?.destination_airport || listing?.destination_station || "—"}`;
  doc.text(airports, 20, y);
  y += 10;

  const rows: Array<[string, string]> = [];
  rows.push([
    "Departure",
    `${listing?.departure_date ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy") : "—"}${listing?.departure_time ? ` · ${String(listing.departure_time).slice(0, 5)}` : ""}`,
  ]);
  if (listing?.return_date) {
    rows.push([
      "Return",
      `${format(new Date(listing.return_date), "EEE, MMM d, yyyy")}${listing?.return_departure_time ? ` · ${String(listing.return_departure_time).slice(0, 5)}` : ""}${listing?.return_flight_number ? ` · ${listing.return_flight_number}` : ""}`,
    ]);
  }
  rows.push(["Airline / Operator", listing?.airline || listing?.operator || "—"]);
  if (listing?.flight_number || listing?.train_number) {
    rows.push(["Flight / Train #", listing?.flight_number || listing?.train_number]);
  }
  if (listing?.train_class) rows.push(["Class", listing.train_class]);
  rows.push(["Passengers", String(p.quantity ?? 1)]);
  if (seller?.full_name) rows.push(["Seller", seller.full_name]);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(k, 20, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(String(v ?? "—"), 70, y);
    y += 7;
  });

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, 190, y);
  y += 8;

  // Credentials block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Booking credentials", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Booking reference", 20, y);
  doc.setFont("courier", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(String(p.transfer_booking_ref ?? "—"), 20, y + 9);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Surname", 20, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(String(p.transfer_surname ?? "—"), 20, y + 7);
  y += 14;

  if (p.buyer_full_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("Passenger name on ticket", 20, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(String(p.buyer_full_name), 20, y + 6);
    y += 14;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "swappup booking confirmation — not a boarding pass. Retrieve your ticket on the airline's website using the credentials above.",
    20,
    280,
    { maxWidth: 170 },
  );
  doc.text(`Purchase ID: ${p.id}`, 20, 285);
  doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 20, 290);

  doc.save(`swappup-booking-${p.transfer_booking_ref || p.id}.pdf`);
}

export function downloadReceiptPdf(p: any, listing: any, profile: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Payment receipt");

  const cur = listing?.currency || "EUR";
  let y = 44;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Billed to", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(profile?.full_name || "—", 20, y);
  y += 5;
  doc.text(profile?.email || p.buyer_email || "—", 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Order", 20, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const orderRows: Array<[string, string]> = [
    ["Purchase ID", p.id],
    ["Date", format(new Date(p.created_at), "yyyy-MM-dd HH:mm")],
    ["Status", String(p.status).replace(/_/g, " ")],
    ["Item", listing?.title || "Ticket"],
    ["Quantity", String(p.quantity ?? 1)],
  ];
  if (p.stripe_payment_id) orderRows.push(["Payment ID", p.stripe_payment_id]);
  if (p.escrow_status && p.escrow_status !== "none") orderRows.push(["Escrow", p.escrow_status]);
  orderRows.forEach(([k, v]) => {
    doc.setTextColor(110, 110, 110);
    doc.text(k, 20, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v ?? "—"), 70, y);
    y += 6;
  });

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, 190, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Breakdown", 20, y);
  y += 8;

  const total = Number(p.total_price || 0);
  const fee = Number(p.name_change_fee || 0);
  const ticket = total - fee;

  const lineItems: Array<[string, string]> = [["Ticket", formatPrice(ticket, cur, cur)]];
  if (fee > 0) lineItems.push(["Name change fee", formatPrice(fee, cur, cur)]);

  doc.setFontSize(11);
  lineItems.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(k, 20, y);
    doc.setTextColor(20, 20, 20);
    doc.text(v, 190, y, { align: "right" });
    y += 7;
  });

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, 190, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", 20, y);
  doc.text(formatPrice(total, cur, cur), 190, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This receipt is issued by swappup as proof of payment. It is not a fiscal invoice.",
    20,
    285,
  );
  doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 20, 290);

  doc.save(`swappup-receipt-${p.id}.pdf`);
}

export async function shareTicket(p: any, listing: any) {
  if (typeof navigator === "undefined" || !("share" in navigator)) return;
  const route =
    listing?.origin_city && listing?.destination_city
      ? `${listing.origin_city} → ${listing.destination_city}`
      : listing?.title || "Ticket";
  const dateStr = listing?.departure_date
    ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy")
    : "";
  const text = [
    `${route}${dateStr ? ` · ${dateStr}` : ""}`,
    p.transfer_booking_ref ? `Booking: ${p.transfer_booking_ref}` : "",
    p.transfer_surname ? `Surname: ${p.transfer_surname}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    await (navigator as any).share({
      title: "My swappup ticket",
      text,
      url: window.location.href,
    });
  } catch {
    /* user cancelled — silent */
  }
}

export function canShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}
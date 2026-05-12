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

/* ----------------------------------------------------------------
 * Brand kit for PDF surfaces (light paper adaptation of the dark theme)
 * ---------------------------------------------------------------- */
const BRAND = {
  ink: [15, 17, 22] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  subtle: [140, 140, 140] as [number, number, number],
  gold: [244, 169, 41] as [number, number, number],
  goldDeep: [217, 138, 15] as [number, number, number],
  goldTint: [254, 243, 220] as [number, number, number],
  paper: [248, 248, 246] as [number, number, number],
  divider: [230, 230, 230] as [number, number, number],
};

const SUPPORT = {
  email: "support@swappup.com",
  helpUrl: "https://swappup.com/help",
  termsUrl: "https://swappup.com/terms",
  responseTime: "We reply within 24h on business days.",
};

const DISCLAIMER_BOOKING =
  "swappup is a peer-to-peer marketplace. This document confirms your purchase on swappup; it is not a boarding pass and does not grant boarding rights. Your airline ticket is provided by the seller via a name change on the original booking. For terms and consumer rights, visit swappup.com/terms.";

const DISCLAIMER_RECEIPT =
  "Issued by swappup as proof of payment. Not a fiscal invoice. swappup is not the merchant of record for the underlying flight ticket; it operates a peer-to-peer marketplace facilitating the transfer between buyer and seller. For terms, visit swappup.com/terms.";

function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setText(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function brandHeader(doc: jsPDF, subtitle: string, rightLine?: string) {
  // Top gold accent bar (full width)
  setFill(doc, BRAND.gold);
  doc.rect(0, 0, 210, 4, "F");
  // Left gold ribbon
  setFill(doc, BRAND.gold);
  doc.rect(0, 4, 3, 24, "F");

  // Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setText(doc, BRAND.ink);
  doc.text("swappup", 14, 18);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, BRAND.muted);
  doc.text(subtitle.toUpperCase(), 14, 24);

  // Right meta
  if (rightLine) {
    doc.setFontSize(9);
    setText(doc, BRAND.muted);
    doc.text(rightLine, 196, 18, { align: "right" });
  }

  // Hairline separator
  setDraw(doc, BRAND.divider);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 196, 32);
}

function sectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, BRAND.goldDeep);
  doc.text(label.toUpperCase(), x, y);
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.4);
  const w = doc.getTextWidth(label.toUpperCase());
  doc.line(x, y + 1.4, x + w, y + 1.4);
}

function panel(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: [number, number, number],
) {
  setFill(doc, fill);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
}

function brandFooter(doc: jsPDF, disclaimer: string, orderId: string) {
  const pageH = 297;
  // Gold rule
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.4);
  doc.line(14, pageH - 28, 196, pageH - 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, BRAND.subtle);
  const wrapped = doc.splitTextToSize(disclaimer, 182);
  doc.text(wrapped, 14, pageH - 23);

  doc.setFontSize(7);
  setText(doc, BRAND.muted);
  doc.text(`Order ${orderId}`, 14, pageH - 8);
  doc.text(
    `Generated ${format(new Date(), "dd MMM yyyy · HH:mm")}`,
    196,
    pageH - 8,
    { align: "right" },
  );
}

function greetingBlock(
  doc: jsPDF,
  y: number,
  fullName: string | undefined,
  body: string,
): number {
  const first = (fullName || "").trim().split(/\s+/)[0] || "there";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setText(doc, BRAND.ink);
  doc.text(`Hi ${first},`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setText(doc, BRAND.muted);
  const wrapped = doc.splitTextToSize(body, 182);
  doc.text(wrapped, 14, y + 7);
  return y + 7 + wrapped.length * 5 + 4;
}

function supportBlock(doc: jsPDF, y: number): number {
  panel(doc, 14, y, 182, 24, BRAND.paper);
  sectionLabel(doc, "Need help?", 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, BRAND.ink);
  doc.text("Email", 18, y + 13);
  doc.text("Help", 18, y + 19);

  setText(doc, BRAND.goldDeep);
  doc.textWithLink(SUPPORT.email, 36, y + 13, {
    url: `mailto:${SUPPORT.email}`,
  });
  doc.textWithLink(SUPPORT.helpUrl.replace(/^https?:\/\//, ""), 36, y + 19, {
    url: SUPPORT.helpUrl,
  });

  setText(doc, BRAND.muted);
  doc.setFontSize(8.5);
  doc.text(SUPPORT.responseTime, 192, y + 19, { align: "right" });

  return y + 24 + 6;
}

/* ----------------------------------------------------------------
 * Booking confirmation PDF
 * ---------------------------------------------------------------- */
export async function downloadTicketPdf(p: any, listing: any, seller?: any, profile?: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const orderShort = String(p.id).slice(0, 8).toUpperCase();
  brandHeader(
    doc,
    "Booking confirmation",
    `Order #${orderShort} · ${format(new Date(p.created_at), "dd MMM yyyy")}`,
  );

  let y = 44;
  y = greetingBlock(
    doc,
    y,
    profile?.full_name,
    "Your purchase is confirmed. Use the booking credentials below to retrieve your ticket on the airline's website and complete check-in.",
  );

  /* Trip panel */
  const tripH = listing?.return_date ? 46 : 40;
  panel(doc, 14, y, 182, tripH, BRAND.paper);
  sectionLabel(doc, "Trip", 18, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setText(doc, BRAND.ink);
  const isRoundTrip = !!listing?.return_date;
  const sep = isRoundTrip ? "<>" : ">";
  const route = `${listing?.origin_city ?? "—"} ${sep} ${listing?.destination_city ?? "—"}`;
  doc.text(route, 18, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, BRAND.muted);
  const airports = `${listing?.origin_airport || "—"}  ${sep}  ${listing?.destination_airport || "—"}`;
  doc.text(airports, 18, y + 19);

  setText(doc, BRAND.ink);
  doc.setFontSize(10);
  const depDate = listing?.departure_date ? format(new Date(listing.departure_date), "EEE, dd MMM yyyy") : "—";
  const depTime = listing?.departure_time ? String(listing.departure_time).slice(0, 5) : "";
  const arrTime = listing?.arrival_time ? String(listing.arrival_time).slice(0, 5) : "";
  const dep = `${depDate}${depTime ? ` · ${depTime}` : ""}${arrTime ? ` → ${arrTime}` : ""}`;
  doc.text(`Departure  ${dep}`, 18, y + 26);

  let tripCursor = y + 32;
  if (isRoundTrip) {
    const rDate = format(new Date(listing.return_date), "EEE, dd MMM yyyy");
    const rDep = listing?.return_departure_time ? String(listing.return_departure_time).slice(0, 5) : "";
    const rArr = listing?.return_arrival_time ? String(listing.return_arrival_time).slice(0, 5) : "";
    const rFn = listing?.return_flight_number ? ` · ${listing.return_flight_number}` : "";
    const ret = `${rDate}${rDep ? ` · ${rDep}` : ""}${rArr ? ` → ${rArr}` : ""}${rFn}`;
    doc.text(`Return     ${ret}`, 18, tripCursor);
    tripCursor += 6;
  }
  const carrier = listing?.airline || "—";
  const flightNo = listing?.flight_number;
  const carrierLine = `${carrier}${flightNo ? ` · ${flightNo}` : ""} · ${p.quantity} ${p.quantity === 1 ? "passenger" : "passengers"}`;
  doc.text(carrierLine, 18, tripCursor);

  y += tripH + 6;

  /* Credentials panel — soft gold */
  const credH = p.buyer_full_name ? 50 : 42;
  panel(doc, 14, y, 182, credH, BRAND.goldTint);
  sectionLabel(doc, "Booking credentials", 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, BRAND.muted);
  doc.text("BOOKING REFERENCE", 18, y + 13);

  doc.setFont("courier", "bold");
  doc.setFontSize(22);
  setText(doc, BRAND.ink);
  doc.text(String(p.transfer_booking_ref ?? "—"), 18, y + 24);

  // Surname (left) + Passenger (right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, BRAND.muted);
  doc.text("SURNAME", 18, y + 32);
  doc.text("PASSENGER", 110, y + 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(doc, BRAND.ink);
  doc.text(String(p.transfer_surname ?? "—"), 18, y + 39);
  doc.text(String(p.buyer_full_name ?? "—"), 110, y + 39);

  if (p.transfer_payment_proof_url) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(doc, BRAND.goldDeep);
    doc.textWithLink("View seller payment proof", 18, y + 46, {
      url: p.transfer_payment_proof_url,
    });
  }

  y += credH + 8;

  // Support
  if (y > 230) {
    doc.addPage();
    brandHeader(doc, "Booking confirmation", `Order #${orderShort}`);
    y = 44;
  }
  supportBlock(doc, y);

  brandFooter(doc, DISCLAIMER_BOOKING, orderShort);
  doc.save(`swappup-booking-${p.transfer_booking_ref || p.id}.pdf`);
}

/* ----------------------------------------------------------------
 * Payment receipt PDF
 * ---------------------------------------------------------------- */
export function downloadReceiptPdf(p: any, listing: any, profile: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const orderShort = String(p.id).slice(0, 8).toUpperCase();
  brandHeader(
    doc,
    "Payment receipt",
    `Receipt #${orderShort} · ${format(new Date(p.created_at), "dd MMM yyyy")}`,
  );

  const cur = listing?.currency || "EUR";
  let y = 44;

  y = greetingBlock(
    doc,
    y,
    profile?.full_name,
    "Thanks for your purchase. Here's your payment receipt — keep it for your records.",
  );

  /* Billed to + Order panel (two columns) */
  panel(doc, 14, y, 89, 32, BRAND.paper);
  sectionLabel(doc, "Billed to", 18, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, BRAND.ink);
  doc.text(profile?.full_name || "—", 18, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(doc, BRAND.muted);
  doc.text(profile?.email || p.buyer_email || "—", 18, y + 20);
  if (listing?.title) {
    doc.text(
      doc.splitTextToSize(`Item: ${listing.title}`, 80),
      18,
      y + 26,
    );
  }

  panel(doc, 107, y, 89, 32, BRAND.paper);
  sectionLabel(doc, "Order", 111, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, BRAND.muted);
  doc.text("Date", 111, y + 13);
  doc.text("Status", 111, y + 19);
  doc.text("Payment", 111, y + 25);
  setText(doc, BRAND.ink);
  doc.text(format(new Date(p.created_at), "dd MMM yyyy · HH:mm"), 135, y + 13);
  doc.text(String(p.status).replace(/_/g, " "), 135, y + 19);
  doc.text(p.stripe_payment_id ? p.stripe_payment_id.slice(0, 22) : "—", 135, y + 25);

  y += 38;

  /* Breakdown */
  sectionLabel(doc, "Breakdown", 14, y);
  y += 6;

  const total = Number(p.total_price || 0);
  const fee = Number(p.name_change_fee || 0);
  const ticket = total - fee;

  const lineItems: Array<[string, string]> = [
    [`Ticket × ${p.quantity ?? 1}`, formatPrice(ticket, cur, cur)],
  ];
  if (fee > 0) lineItems.push(["Name change fee", formatPrice(fee, cur, cur)]);

  doc.setFontSize(11);
  lineItems.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    setText(doc, BRAND.ink);
    doc.text(k, 14, y);
    doc.text(v, 196, y, { align: "right" });
    y += 7;
  });

  setDraw(doc, BRAND.divider);
  doc.setLineWidth(0.2);
  doc.line(14, y, 196, y);
  y += 8;

  // Total row, gold accent
  panel(doc, 14, y - 6, 182, 12, BRAND.goldTint);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(doc, BRAND.ink);
  doc.text("Total paid", 18, y + 1.5);
  doc.text(formatPrice(total, cur, cur), 192, y + 1.5, { align: "right" });
  y += 14;

  if (p.escrow_status && p.escrow_status !== "none") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, BRAND.muted);
    doc.text(`Escrow status: ${p.escrow_status}`, 14, y);
    y += 8;
  }

  if (y < 220) y = Math.max(y, 220);
  supportBlock(doc, y);

  brandFooter(doc, DISCLAIMER_RECEIPT, orderShort);
  doc.save(`swappup-receipt-${orderShort}.pdf`);
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
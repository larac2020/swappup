import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  ChevronRight,
  HelpCircle,
  CreditCard,
  Ticket,
  Shield,
  FileText
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the name change process work?",
    answer: "When you purchase a ticket, the seller provides the original booking details. You'll need to contact the airline directly to change the name on the ticket. The airline charges a name change fee, which is shown on each listing. This fee is paid directly to the airline, not through FlySwap.",
  },
  {
    question: "Is it safe to buy tickets on FlySwap?",
    answer: "Yes! All sellers must verify their identity before listing tickets. We also provide buyer protection - if a ticket turns out to be invalid, you'll receive a full refund. Payment is held securely until the ticket transfer is confirmed.",
  },
  {
    question: "How do I get verified to sell tickets?",
    answer: "Go to Account > ID Verification and upload a valid government-issued ID (passport, driver's license, or national ID card). Verification typically takes 1-2 business days. Once verified, you can start listing tickets.",
  },
  {
    question: "What happens if my flight is cancelled?",
    answer: "If the airline cancels the flight, the seller is responsible for providing a refund through FlySwap. Our buyer protection covers you in this scenario. Contact our support team with the cancellation notice.",
  },
  {
    question: "How do refunds work?",
    answer: "Refunds are processed within 5-7 business days. If you're entitled to a refund, the amount will be returned to your original payment method. Service fees may be non-refundable depending on the circumstances.",
  },
  {
    question: "Can I sell one-way tickets?",
    answer: "Yes! You can sell one-way tickets, round-trip tickets, or even multiple tickets together. Just make sure to accurately describe what's included in your listing.",
  },
];

const categories = [
  { icon: Ticket, label: "Buying Tickets", description: "How to purchase and receive tickets" },
  { icon: CreditCard, label: "Payments & Refunds", description: "Billing, refunds, and payment methods" },
  { icon: Shield, label: "Safety & Security", description: "Account protection and fraud prevention" },
  { icon: FileText, label: "Selling Tickets", description: "Create listings and manage sales" },
];

export default function Support() {
  const navigate = useNavigate();

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="flex items-center gap-4 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Help & Support</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              className="pl-10 h-12 bg-secondary/50"
            />
          </div>

          {/* Contact Options */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">Contact Us</h2>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <MessageCircle className="w-6 h-6 text-primary" />
                <span className="text-xs">Live Chat</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <Mail className="w-6 h-6 text-primary" />
                <span className="text-xs">Email</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <Phone className="w-6 h-6 text-primary" />
                <span className="text-xs">Call Us</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h2 className="font-semibold">Browse by Topic</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.label}
                    className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-6 h-6 text-primary mb-2" />
                    <p className="font-medium text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            <h2 className="font-semibold">Frequently Asked Questions</h2>
            <div className="glass rounded-2xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                    <AccordionTrigger className="px-4 text-left hover:no-underline hover:text-primary">
                      <span className="text-sm">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Still Need Help */}
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-primary mx-auto" />
            <div>
              <h3 className="font-semibold">Still need help?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Our support team is available 24/7 to assist you.
              </p>
            </div>
            <Button variant="gold" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Live Chat
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

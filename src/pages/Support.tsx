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
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const faqKeys: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "supFaq1Q", a: "supFaq1A" },
  { q: "supFaq2Q", a: "supFaq2A" },
  { q: "supFaq3Q", a: "supFaq3A" },
  { q: "supFaq4Q", a: "supFaq4A" },
  { q: "supFaq5Q", a: "supFaq5A" },
  { q: "supFaq6Q", a: "supFaq6A" },
];

const categoryDefs: { icon: any; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: Ticket, labelKey: "supCatBuying", descKey: "supCatBuyingDesc" },
  { icon: CreditCard, labelKey: "supCatPayments", descKey: "supCatPaymentsDesc" },
  { icon: Shield, labelKey: "supCatSafety", descKey: "supCatSafetyDesc" },
  { icon: FileText, labelKey: "supCatSelling", descKey: "supCatSellingDesc" },
];

export default function Support() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="flex items-center gap-4 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">{t("supTitle")}</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("supSearchPh")}
              className="pl-10 h-12 bg-secondary/50"
            />
          </div>

          {/* Contact Options */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">{t("supContact")}</h2>
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <MessageCircle className="w-6 h-6 text-primary" />
                <span className="text-xs">{t("supLiveChat")}</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <Mail className="w-6 h-6 text-primary" />
                <span className="text-xs">{t("supEmail")}</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <Phone className="w-6 h-6 text-primary" />
                <span className="text-xs">{t("supCall")}</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h2 className="font-semibold">{t("supBrowseTopic")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {categoryDefs.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.labelKey}
                    className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-6 h-6 text-primary mb-2" />
                    <p className="font-medium text-sm">{t(category.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t(category.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-3">
            <h2 className="font-semibold">{t("supFaqHeading")}</h2>
            <div className="glass rounded-2xl">
              <Accordion type="single" collapsible className="w-full">
                {faqKeys.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                    <AccordionTrigger className="px-4 text-left hover:no-underline hover:text-primary">
                      <span className="text-sm">{t(faq.q)}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-sm text-muted-foreground">
                      {t(faq.a)}
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
              <h3 className="font-semibold">{t("supStillNeed")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("supStillNeedDesc")}
              </p>
            </div>
            <Button variant="gold" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("supStartLiveChat")}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import type { Locale } from "./translations";

type LocalizedString = Record<Locale, string>;

export const marketingMeta = {
  landing: {
    title: { en: "Swappup — Buy & resell unused flight tickets", it: "Swappup — Compra e rivendi biglietti aerei inutilizzati" },
    description: {
      en: "Swappup is where travellers resell flights they can't use and find seats from people whose plans changed — safely and ID-checked.",
      it: "Swappup è il marketplace dove i viaggiatori rivendono i voli che non possono prendere e trovano posti da chi ha cambiato programma — in sicurezza e con ID verificato.",
    },
    ogDescription: {
      en: "Get money back for flights you can't take, or grab a seat someone else can't use. Payments held safely until the ticket is in your name.",
      it: "Riprenditi i soldi dei voli che non puoi prendere, o trova un posto che qualcun altro non può usare. Pagamenti custoditi finché il biglietto non è a tuo nome.",
    },
  },
  about: {
    title: { en: "About Swappup", it: "Chi siamo — Swappup" },
    description: {
      en: "Swappup is on a mission to make air travel less wasteful. Learn who we are, what we do and why we built a peer-to-peer ticket marketplace.",
      it: "Swappup nasce per dare una seconda vita ai biglietti aerei inutilizzati. Scopri la nostra missione: aiutare i viaggiatori a recuperare il valore dei voli che non possono prendere.",
    },
    ogDescription: {
      en: "Our mission: make air travel less wasteful.",
      it: "La nostra missione: rendere i viaggi aerei meno sprecati.",
    },
  },
  faq: {
    title: { en: "FAQ & Help Centre | Swappup", it: "Domande frequenti e assistenza | Swappup" },
    description: {
      en: "Answers to the most common questions about Swappup: pricing, buyer protection, how selling and buying flight tickets works, and account support.",
      it: "Tutte le risposte su Swappup: come funziona, prezzi, pagamenti protetti, trasferimento dei biglietti e supporto per acquirenti e venditori.",
    },
    ogDescription: {
      en: "Pricing, buyer protection, selling, buying and account support — all in one place.",
      it: "Prezzi, protezione acquirenti, come vendere, come comprare e assistenza account — tutto in un unico posto.",
    },
  },
} satisfies Record<string, Record<string, LocalizedString>>;

export const landingContent = {
  en: {
    heroTitle1: "Don't miss out on your flight ticket.",
    heroTitle2: "Swappup it.",
    heroSubtitle:
      "Plans changed? List your ticket for free and get your money back. Need a seat? Grab one from someone who can't fly anymore — usually for less than the airline charges.",
    ctaGetStarted: "Get started",
    ctaHaveAccount: "I already have an account",
    browseCaption: "Browse and AI-search seats from real travellers.",
    sellCaption: "Snap your ticket — we fill in the rest.",
    demoEyebrow: "See it in action",
    demoTitle: "From upload to payout, in under a minute.",
    demoSubtitle: "Upload your ticket, let us auto-fill the details, and publish. Buyers find it through smart search — you get paid the moment the name change clears.",
    sellTitle: "Turn unused tickets into cash",
    sellBody:
      "Most airlines won't refund your ticket if your plans change. Swappup helps you get that money back — someone else takes your seat, and you walk away with cash in your pocket.",
    sellBullets: [
      "You pick the price. You're in charge.",
      "Only sell to people who've shown us a real ID — no anonymous buyers.",
      "We hold the buyer's money safely until they confirm the ticket is in their name.",
    ],
    buyTitle: "Find seats other travellers can't use",
    buyBody:
      "Browse flights from travellers whose plans fell through. Often cheaper than booking direct — same seat, same flight, same airline.",
    buyBullets: [
      "Search by route, date or destination — or just tell us where you fancy going.",
      "We check the ticket can actually be transferred before you pay.",
      "If the ticket isn't in your name within 24 hours, you get your money back.",
    ],
    whyTitle: "Why Swappup",
    whySubtitle: "Built around the things that actually matter when money and travel meet.",
    why: [
      { title: "Effortless listing", body: "Snap a photo of your ticket — we fill in the flight details for you." },
      { title: "Protected payments", body: "We hold the buyer's money and only pass it on once the ticket is properly in their name." },
      { title: "ID-verified users", body: "Everyone on Swappup checks in with a real ID before buying or selling." },
      { title: "Real value recovered", body: "Get back the money the airline would otherwise pocket." },
    ],
    finalTitle: "Ready to swap your next flight?",
    finalSubtitle: "Free to join. Takes a minute to list a ticket or find one.",
    finalCta: "Create your account",
    finalLogin: "Login",
  },
  it: {
    heroTitle1: "Non perdere il tuo biglietto aereo.",
    heroTitle2: "Swappalo.",
    heroSubtitle:
      "Hai cambiato programma? Metti in vendita il tuo biglietto gratis e ricopri le spese.\nCerchi un nuovo viaggio? Compra un biglietto da chi non può più volare, a meno del prezzo originale.",
    ctaGetStarted: "Inizia ora",
    ctaHaveAccount: "Ho già un account",
    browseCaption: "Sfoglia e cerca con l'AI i posti messi in vendita da viaggiatori veri.",
    sellCaption: "Fai una foto al tuo biglietto — al resto pensiamo noi.",
    demoEyebrow: "Guarda com'è facile",
    demoTitle: "Dall'upload alla vendita, in meno di un minuto.",
    demoSubtitle: "Pronto a vendere? Carica il tuo biglietto e pubblica l'annuncio in pochi click. In cerca di un nuovo viaggio? Trova il tuo prossimo volo con la ricerca smart.",
    sellTitle: "Trasforma i biglietti inutilizzati in denaro",
    sellBody:
      "La maggior parte delle compagnie aeree non rimborsa il biglietto se cambi programma. Swappup ti aiuta a recuperare quei soldi — qualcun altro prende il tuo posto e tu ti porti a casa il valore del biglietto.",
    sellBullets: [
      "Scegli tu il prezzo. Decidi tu.",
      "Vendi solo a persone che ci hanno mostrato un documento vero — niente acquirenti anonimi.",
      "Custodiamo i soldi dell'acquirente in sicurezza finché non conferma che il biglietto è a suo nome.",
    ],
    buyTitle: "Trova posti che altri viaggiatori non possono usare",
    buyBody:
      "Sfoglia voli messi in vendita da viaggiatori che hanno cambiato programma. Spesso costano meno che prenotare direttamente — stesso posto, stesso volo, stessa compagnia.",
    buyBullets: [
      "Cerca per rotta, data o destinazione — o raccontaci semplicemente dove ti andrebbe di andare.",
      "Controlliamo che il biglietto sia davvero trasferibile prima che tu paghi.",
      "Se entro 24 ore il biglietto non è a tuo nome, ti restituiamo i soldi.",
    ],
    whyTitle: "Perché Swappup",
    whySubtitle: "Pensato attorno alle cose che contano davvero quando si parla di soldi e viaggi.",
    why: [
      { title: "Mettere in vendita è facile", body: "Fai una foto al tuo biglietto — compiliamo noi i dettagli del volo." },
      { title: "Pagamenti protetti", body: "Custodiamo i soldi dell'acquirente e li sblocchiamo solo quando il biglietto è davvero a suo nome." },
      { title: "Utenti con ID verificato", body: "Tutti su Swappup si registrano con un documento vero prima di comprare o vendere." },
      { title: "Valore davvero recuperato", body: "Riprenditi i soldi che altrimenti resterebbero alla compagnia aerea." },
    ],
    finalTitle: "Pronto a scambiare il tuo prossimo volo?",
    finalSubtitle: "Iscriverti è gratis. Basta un minuto per mettere in vendita un biglietto o trovarne uno.",
    finalCta: "Crea il tuo account",
    finalLogin: "Accedi",
  },
} as const;

export const aboutContent = {
  en: {
    h1: "About Swappup",
    intro: "A peer-to-peer marketplace for flight tickets that would otherwise go to waste.",
    sections: [
      {
        h2: "What we do",
        body: "Swappup lets travellers buy and resell unused flight tickets. When your plans change, instead of losing the value of your ticket, you can pass it on — securely — to someone who needs it. And when you're looking for a flight, you can find seats from real travellers, often cheaper than the airline's current price.",
      },
      {
        h2: "Who it's for",
        body: "For anyone whose travel plans don't always go to plan. For frequent flyers, last-minute changers, students, families, freelancers. For people who hate seeing money — and seats — go to waste.",
      },
      {
        h2: "Our mission",
        body: "Make air travel less wasteful. Every year, millions of flight tickets go unused. The seats fly anyway. Swappup connects those tickets to people who want them, so value flows back to travellers instead of disappearing.",
      },
      {
        h2: "Our vision",
        body: "A world where buying and reselling a flight ticket is as natural as reselling a concert ticket — fast, fair, verified, and trusted. We want Swappup to be the default place travellers go when their plans shift.",
      },
      {
        h2: "How we keep it safe",
        body: "Every user is ID-verified. Every payment is held safely by Swappup until the buyer confirms the ticket is in their name. Sellers have a strict 24-hour deadline to complete the transfer, and buyers are refunded automatically if they don't. Our anti-fraud system blocks self-dealing and unrealistic prices before they ever reach the marketplace.",
      },
    ],
  },
  it: {
    h1: "Chi siamo",
    intro: "Un marketplace tra viaggiatori per biglietti aerei che altrimenti andrebbero sprecati.",
    sections: [
      {
        h2: "Cosa facciamo",
        body: "Swappup ti permette di comprare e rivendere biglietti aerei inutilizzati. Se cambi programma, invece di perdere il valore del biglietto puoi passarlo — in sicurezza — a qualcuno che ne ha bisogno. E se stai cercando un volo, puoi trovare posti messi in vendita da viaggiatori veri, spesso a meno del prezzo attuale della compagnia aerea.",
      },
      {
        h2: "Per chi è",
        body: "Per chiunque, perché i piani di viaggio non vanno sempre come previsto. Per chi vola spesso, per chi cambia programma all'ultimo, per studenti, famiglie, freelance. Per chi odia vedere soldi — e posti — andare sprecati.",
      },
      {
        h2: "La nostra missione",
        body: "Rendere i viaggi aerei meno sprecati. Ogni anno milioni di biglietti aerei restano inutilizzati. I posti volano comunque. Swappup collega quei biglietti a chi li vuole, così il valore torna ai viaggiatori invece di sparire.",
      },
      {
        h2: "La nostra visione",
        body: "Un mondo in cui comprare e rivendere un biglietto aereo è naturale come rivendere un biglietto di un concerto — veloce, equo, verificato e affidabile. Vogliamo che Swappup sia il posto a cui i viaggiatori pensano subito quando i piani cambiano.",
      },
      {
        h2: "Come teniamo tutto sicuro",
        body: "Ogni utente ha l'ID verificato. Ogni pagamento è custodito in sicurezza da Swappup finché l'acquirente non conferma che il biglietto è a suo nome. I venditori hanno 24 ore tassative per completare il trasferimento, e gli acquirenti vengono rimborsati automaticamente se questo non avviene. Il nostro sistema antifrode blocca auto-transazioni e prezzi irrealistici prima ancora che arrivino sul marketplace.",
      },
    ],
  },
} as const;

export const faqContent = {
  en: {
    h1: "Frequently asked questions",
    intro:
      "Everything you need to know about pricing, protection and using Swappup — for both first-time visitors and existing travellers.",
    stillNeedHelp: {
      h2: "Still need help?",
      bodyBefore: "Signed-in users can reach our team from the in-app Support page. New here? ",
      linkText: "Create an account",
      bodyAfter: " to get started.",
    },
    sections: [
      {
        title: "Getting started",
        items: [
          { q: "What is Swappup?", a: "Swappup is a peer-to-peer marketplace for flight tickets. If your plans change, you can list your unused ticket and recover its value. If you're looking for a flight, you can buy a seat from a real traveller — often well below the airline's current price." },
          { q: "Who can use Swappup?", a: "Anyone aged 18 or over with a valid government-issued ID. Every account is ID-verified before you can buy or sell." },
          { q: "How do I sign up?", a: "signup_link" },
          { q: "Which countries and airlines are supported?", a: "Swappup works globally for any flight on an airline that allows passenger name changes. Whether a specific ticket can be transferred depends on the airline and the fare rules — we check this for you when you list it." },
        ],
      },
      {
        title: "Pricing",
        items: [
          { q: "How much does it cost to list a ticket?", a: "Listing a ticket on Swappup is completely free. You only pay anything if your ticket actually sells." },
          { q: "Are there any fees for buyers or sellers?", a: "Swappup charges a small service fee on successful transactions to cover payment processing, secure payment handling, identity verification and platform operations. The exact amount is always shown clearly before you confirm a purchase or accept an offer — there are no surprises at checkout." },
          { q: "Who pays the airline name-change fee?", a: "The buyer pays the airline's name-change fee on top of the ticket price. We estimate it upfront based on the airline, hold it safely at checkout, and release it to the seller once the transfer is confirmed." },
          { q: "How do I set my price?", a: "You choose the price when you list. The only rule is that you can't list above the original price you paid the airline — this keeps the marketplace fair and prevents scalping." },
        ],
      },
      {
        title: "Buyer protection & safety",
        items: [
          { q: "How do I know the ticket is real?", a: "Every listing is checked against the airline's booking reference. Sellers must upload proof of purchase, and our system verifies the flight details (route, date, airline, passenger count) before the listing goes live." },
          { q: "What happens to my money before I receive the ticket?", a: "Your payment is held safely by Swappup. The seller is only paid once you confirm the ticket has been transferred into your name. If the transfer doesn't happen on time, you are refunded automatically." },
          { q: "What if the seller doesn't transfer the ticket?", a: "Sellers have a strict 24-hour deadline to complete the transfer after a purchase. If they miss it, the order is cancelled and you get a full refund — no questions asked." },
          { q: "Are other users verified?", a: "Yes. Every Swappup account passes AI-powered ID verification before they can buy or sell. We also run anti-fraud checks on every listing and block self-dealing and unrealistic prices automatically." },
        ],
      },
      {
        title: "Selling on Swappup",
        items: [
          { q: "How do I list a ticket?", a: "From your account, tap Sell, upload your booking confirmation, and our system will extract the flight details automatically. Review, set your price, and publish. It takes about a minute." },
          { q: "Can I sell any ticket?", a: "Only tickets on airlines that allow passenger name changes. We tell you upfront whether your specific airline supports it, what the typical fee is, and any conditions." },
          { q: "When do I get paid?", a: "After the buyer purchases, you have 24 hours to complete the name change with the airline. Once the buyer confirms receipt, your payout is released to your linked account." },
          { q: "Can I cancel a listing?", a: "Yes, anytime before a buyer purchases it. Once a purchase has been made, you're committed to completing the transfer within 24 hours." },
        ],
      },
      {
        title: "Buying on Swappup",
        items: [
          { q: "How do I find a flight?", a: "Use the Browse page or our AI Search to describe where and when you want to travel. Filter by date, airline, price, or destination type." },
          { q: "How long does the transfer take?", a: "Most airlines process name changes within a few hours. The seller has up to 24 hours after purchase to complete it. You'll receive an email and in-app notification at each step." },
          { q: "What if I change my mind after buying?", a: "Because tickets are tied to flight dates, all sales are final once you confirm the ticket is in your name. Before that point, your payment is held safely and refundable if the transfer doesn't go through." },
        ],
      },
      {
        title: "Account & support",
        items: [
          { q: "How do I contact support?", a: "Signed-in users can reach our team from the Support page inside the app. We typically reply within one business day." },
          { q: "How is my data handled?", a: "privacy_link" },
          { q: "How do I close my account?", a: "From Account → Privacy & Data, you can permanently delete your account and personal data at any time." },
        ],
      },
    ],
    signupLinkAnswer: {
      before: "Create an account from the ",
      link: "Sign up",
      after: " page. After signing up you'll go through a quick 6-step setup including ID verification. This unlocks buying and selling.",
    },
    privacyLinkAnswer: {
      before: "We're UK GDPR compliant. You can export or delete your data at any time from your account settings. See our ",
      link: "Privacy Policy",
      after: " for details.",
    },
  },
  it: {
    h1: "Domande frequenti",
    intro:
      "Tutto quello che devi sapere su prezzi, protezione e su come usare Swappup — sia se sei nuovo, sia se sei già un viaggiatore della community.",
    stillNeedHelp: {
      h2: "Ti serve ancora aiuto?",
      bodyBefore: "Se hai un account puoi contattare il nostro team dalla pagina Supporto nell'app. Sei nuovo qui? ",
      linkText: "Crea un account",
      bodyAfter: " per iniziare.",
    },
    sections: [
      {
        title: "Per iniziare",
        items: [
          { q: "Cos'è Swappup?", a: "Swappup è un marketplace tra viaggiatori per biglietti aerei. Se cambi programma puoi mettere in vendita il tuo biglietto inutilizzato e recuperarne il valore. Se stai cercando un volo, puoi comprare un posto da un viaggiatore vero — spesso molto meno del prezzo attuale della compagnia aerea." },
          { q: "Chi può usare Swappup?", a: "Chiunque abbia almeno 18 anni e un documento d'identità valido. Ogni account viene verificato tramite ID prima di poter comprare o vendere." },
          { q: "Come mi registro?", a: "signup_link" },
          { q: "Quali Paesi e compagnie aeree sono supportati?", a: "Swappup funziona in tutto il mondo per qualsiasi volo di una compagnia aerea che consente il cambio di nome del passeggero. Se un biglietto specifico sia trasferibile dipende dalla compagnia e dalle regole tariffarie — lo controlliamo noi per te quando lo metti in vendita." },
        ],
      },
      {
        title: "Prezzi",
        items: [
          { q: "Quanto costa mettere in vendita un biglietto?", a: "Mettere in vendita un biglietto su Swappup è completamente gratis. Paghi qualcosa solo se il biglietto viene effettivamente venduto." },
          { q: "Ci sono commissioni per acquirenti o venditori?", a: "Swappup applica una piccola commissione di servizio sulle transazioni andate a buon fine per coprire i costi di pagamento, la gestione sicura dei pagamenti, la verifica dell'identità e il funzionamento della piattaforma. L'importo esatto è sempre indicato chiaramente prima di confermare un acquisto o accettare un'offerta — nessuna sorpresa al checkout." },
          { q: "Chi paga le spese di cambio nome della compagnia aerea?", a: "Le spese di cambio nome della compagnia aerea sono a carico dell'acquirente e si aggiungono al prezzo del biglietto. Stimiamo l'importo in anticipo in base alla compagnia, lo tratteniamo in sicurezza al momento del checkout e lo rilasciamo al venditore una volta confermato il trasferimento." },
          { q: "Come stabilisco il prezzo?", a: "Scegli tu il prezzo quando metti in vendita. L'unica regola è che non puoi superare il prezzo originale pagato alla compagnia aerea — così il marketplace resta equo ed evitiamo il bagarinaggio." },
        ],
      },
      {
        title: "Protezione e sicurezza dell'acquirente",
        items: [
          { q: "Come faccio a sapere che il biglietto è vero?", a: "Ogni annuncio viene verificato tramite il codice di prenotazione della compagnia aerea. I venditori devono caricare la prova d'acquisto e il nostro sistema verifica i dettagli del volo (rotta, data, compagnia, numero di passeggeri) prima che l'annuncio diventi pubblico." },
          { q: "Cosa succede ai miei soldi prima che riceva il biglietto?", a: "Il tuo pagamento è custodito in sicurezza da Swappup. Il venditore viene pagato solo dopo che hai confermato che il biglietto è stato trasferito a tuo nome. Se il trasferimento non avviene in tempo, vieni rimborsato automaticamente." },
          { q: "E se il venditore non trasferisce il biglietto?", a: "I venditori hanno 24 ore tassative per completare il trasferimento dopo l'acquisto. Se non rispettano la scadenza, l'ordine viene annullato e ricevi un rimborso completo — senza fare domande." },
          { q: "Anche gli altri utenti sono verificati?", a: "Sì. Ogni account Swappup supera una verifica dell'identità basata su AI prima di poter comprare o vendere. Inoltre eseguiamo controlli antifrode su ogni annuncio e blocchiamo automaticamente auto-transazioni e prezzi irrealistici." },
        ],
      },
      {
        title: "Vendere su Swappup",
        items: [
          { q: "Come metto in vendita un biglietto?", a: "Dal tuo account, tocca Vendi, carica la conferma di prenotazione e il nostro sistema estrarrà automaticamente i dettagli del volo. Controlla, imposta il prezzo e pubblica. Ci vuole circa un minuto." },
          { q: "Posso vendere qualsiasi biglietto?", a: "Solo biglietti di compagnie che consentono il cambio di nome del passeggero. Ti diciamo subito se la tua compagnia lo supporta, qual è la commissione tipica e quali condizioni si applicano." },
          { q: "Quando vengo pagato?", a: "Dopo l'acquisto da parte del compratore hai 24 ore per completare il cambio nome con la compagnia aerea. Una volta che l'acquirente conferma la ricezione, il pagamento viene rilasciato sul tuo conto collegato." },
          { q: "Posso annullare un annuncio?", a: "Sì, in qualsiasi momento prima che un acquirente lo compri. Una volta effettuato l'acquisto, ti impegni a completare il trasferimento entro 24 ore." },
        ],
      },
      {
        title: "Comprare su Swappup",
        items: [
          { q: "Come trovo un volo?", a: "Usa la pagina Esplora o la nostra AI Search per descrivere dove e quando vuoi viaggiare. Filtra per data, compagnia aerea, prezzo o tipo di destinazione." },
          { q: "Quanto tempo richiede il trasferimento?", a: "La maggior parte delle compagnie processa i cambi nome in poche ore. Il venditore ha fino a 24 ore dopo l'acquisto per completarlo. Riceverai una email e una notifica nell'app a ogni passaggio." },
          { q: "Cosa succede se cambio idea dopo aver comprato?", a: "Poiché i biglietti sono legati a date di volo, tutte le vendite sono definitive una volta che confermi che il biglietto è a tuo nome. Prima di quel momento, il tuo pagamento è custodito in sicurezza e rimborsabile se il trasferimento non va a buon fine." },
        ],
      },
      {
        title: "Account e supporto",
        items: [
          { q: "Come contatto il supporto?", a: "Gli utenti registrati possono contattare il nostro team dalla pagina Supporto all'interno dell'app. Di solito rispondiamo entro un giorno lavorativo." },
          { q: "Come vengono gestiti i miei dati?", a: "privacy_link" },
          { q: "Come chiudo il mio account?", a: "Da Account → Privacy e Dati puoi eliminare in modo permanente il tuo account e i tuoi dati personali in qualsiasi momento." },
        ],
      },
    ],
    signupLinkAnswer: {
      before: "Crea un account dalla pagina ",
      link: "Registrati",
      after: ". Dopo la registrazione completerai una breve configurazione in 6 step che include la verifica dell'identità. Da quel momento potrai comprare e vendere.",
    },
    privacyLinkAnswer: {
      before: "Siamo conformi al GDPR del Regno Unito. Puoi esportare o eliminare i tuoi dati in qualsiasi momento dalle impostazioni del tuo account. Per i dettagli, consulta la nostra ",
      link: "Privacy Policy",
      after: ".",
    },
  },
} as const;

export const footerContent = {
  en: {
    tagline: "The peer-to-peer marketplace to buy and resell unused flight tickets.",
    company: "Company",
    about: "About us",
    faq: "FAQ & Help",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    registeredOffice: "Registered office address",
    addressLine: "London, United Kingdom",
    companyNo: "Company No. 00000000",
    rights: (year: number) => `© ${year} Swappup Ltd. All rights reserved.`,
    madeFor: "Made for travellers whose plans change.",
  },
  it: {
    tagline: "Il marketplace tra viaggiatori per comprare e rivendere biglietti aerei inutilizzati.",
    company: "Azienda",
    about: "Chi siamo",
    faq: "FAQ e Assistenza",
    terms: "Termini e Condizioni",
    privacy: "Informativa sulla Privacy",
    registeredOffice: "Sede legale",
    addressLine: "Londra, Regno Unito",
    companyNo: "Numero di iscrizione 00000000",
    rights: (year: number) => `© ${year} Swappup Ltd. Tutti i diritti riservati.`,
    madeFor: "Pensato per i viaggiatori a cui cambiano i piani.",
  },
} as const;

export const headerContent = {
  en: { openApp: "Open app", login: "Login", signup: "Sign up", languageLabel: "Language" },
  it: { openApp: "Apri l'app", login: "Accedi", signup: "Registrati", languageLabel: "Lingua" },
} as const;
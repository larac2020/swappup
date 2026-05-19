## Italian demo section copy update

**File:** `src/i18n/marketingContent.ts` (Italian block only)

1. Replace `demoTitle`:
   - From: `Dall'upload alla vendita, in meno di un minuto.`
   - To: `Vendere o comprare un biglietto non è mai stato così semplice.`

2. Update `demoSubtitle` to split the two sentences onto separate rows using a `\n` line break:
   - From: `Pronto a vendere? Carica il tuo biglietto e pubblica l'annuncio in pochi click. In cerca di un nuovo viaggio? Trova il tuo prossimo volo con la ricerca smart.`
   - To: `Pronto a vendere? Carica il tuo biglietto e pubblica l'annuncio in pochi click.\nIn cerca di un nuovo viaggio? Trova il tuo prossimo volo con la ricerca smart.`

3. In `src/pages/Landing.tsx`, add `whitespace-pre-line` to the demo subtitle `<p>` (currently it has no such class) so the `\n` renders as a visible line break.

English copy is left untouched.

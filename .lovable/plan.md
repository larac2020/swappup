## Confirmed diagnosis

The earlier redirect-allowlist diagnosis is **not the current issue**.

The auth logs show that:

1. Swappup successfully sent the browser to Google.
2. Google successfully returned an authorization code to the native auth callback.
3. The backend failed while exchanging that code for Google tokens with:
   `invalid_client — The provided client secret is invalid.`

The `4/0A` value is the beginning of Google's one-time authorization code, not the underlying error. The duplicate error in both the query string and URL fragment is only the auth failure being forwarded to the app twice; it is not the cause.

The current Site URL is `https://swappup.com`, and both `https://swappup.com/**` and `https://swappup.vercel.app/**` are already allowed redirect destinations. Redirecting Vercel to the custom domain therefore does not fix this credential-exchange failure.

## How to fix it

1. In **Google Cloud Console → APIs & Services → Credentials**, open the exact OAuth 2.0 **Web application** client created for Swappup.
2. Confirm that the Client ID and Client Secret belong to that same client.
3. If Google no longer displays the secret, or the current secret may have been deleted/reset, create a **new client secret on that same OAuth client**.
4. In **Lovable Cloud → Users → Authentication Settings → Sign In Methods → Google**, select/use your custom Google credentials and paste:
   - the complete **Client ID**;
   - the actual **Client Secret value**—normally beginning with `GOCSPX-`—not the secret name, secret ID, or masked value.
5. Save the provider configuration. Do not put these values in Cloud → Secrets.
6. In Google Cloud Console, keep the native backend auth callback shown/required by this provider as an **Authorized redirect URI**. The fact that Google returned a code confirms the callback used in this attempt was already accepted; do not replace it with `https://swappup.com/home` or the Vercel URL.
7. Start a fresh test directly at `https://swappup.com/login` in a private window. Old OAuth attempts cannot be reused after changing the secret.

## Verification

After the credential pair is corrected, verify that the callback no longer logs `invalid_client`, a session is created, and the user remains on `/home` or is routed to `/onboarding` by the existing protected-route guard. No frontend code change is indicated by this error.
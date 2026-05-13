import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Renders all registered templates with their previewData.
// Gated by LOVABLE_API_KEY — only the Go API calls this.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Verify the caller is authorized with LOVABLE_API_KEY
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (token !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const templateNames = Object.keys(TEMPLATES)
  const results: Array<{
    templateName: string
    displayName: string
    subject: string
    html: string
    status: 'ready' | 'preview_data_required' | 'render_failed'
    errorMessage?: string
  }> = []

  // Render each template in both English and Italian so the user can
  // preview both languages directly from the Cloud → Emails view.
  const locales: Array<{ code: 'en' | 'it'; label: string }> = [
    { code: 'en', label: 'EN' },
    { code: 'it', label: 'IT' },
  ]

  for (const name of templateNames) {
    const entry = TEMPLATES[name]
    const baseDisplayName = entry.displayName || name

    if (!entry.previewData) {
      results.push({
        templateName: name,
        displayName: baseDisplayName,
        subject: '',
        html: '',
        status: 'preview_data_required',
      })
      continue
    }

    for (const { code, label } of locales) {
      const localizedData = { ...entry.previewData, locale: code }
      const variantName = `${name}__${code}`
      const variantDisplay = `${baseDisplayName} (${label})`
      try {
        const html = await renderAsync(
          React.createElement(entry.component, localizedData)
        )
        const resolvedSubject =
          typeof entry.subject === 'function'
            ? entry.subject(localizedData)
            : entry.subject

        results.push({
          templateName: variantName,
          displayName: variantDisplay,
          subject: resolvedSubject,
          html,
          status: 'ready',
        })
      } catch (err) {
        console.error('Failed to render template for preview', {
          template: variantName,
          error: err,
        })
        results.push({
          templateName: variantName,
          displayName: variantDisplay,
          subject: '',
          html: '',
          status: 'render_failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return new Response(JSON.stringify({ templates: results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

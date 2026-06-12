import type { AppLocale } from '../i18n/locale'
import type { LabelDocument } from '../types/labels.types'

const PRINT_WRAPPER_MARKER = 'codex-print-wrapper'
const PRINT_FONT_STACK = 'Cairo, Tajawal, "Noto Kufi Arabic", "Noto Sans Arabic", Arial, sans-serif'

function getDirection(locale: AppLocale) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

function getAlign(locale: AppLocale) {
  return locale === 'ar' ? 'right' : 'left'
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function extractDocumentParts(html: string) {
  if (typeof DOMParser === 'undefined') {
    return {
      bodyHtml: html,
      headHtml: '',
      isWrapped: false,
      title: '',
    }
  }

  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const isWrapped = parsed.querySelector(`meta[name="${PRINT_WRAPPER_MARKER}"]`) !== null

  if (isWrapped) {
    return {
      bodyHtml: parsed.body.innerHTML || html,
      headHtml: parsed.head.innerHTML || '',
      isWrapped: true,
      title: parsed.title || '',
    }
  }

  const headHtml = Array.from(parsed.head.children)
    .filter((node) => {
      const tagName = node.tagName.toLowerCase()
      if (tagName === 'title') {
        return false
      }

      if (tagName === 'meta') {
        const charset = node.getAttribute('charset')
        return !charset
      }

      return true
    })
    .map((node) => node.outerHTML)
    .join('\n')

  return {
    bodyHtml: parsed.body.innerHTML || html,
    headHtml,
    isWrapped: false,
    title: parsed.title || '',
  }
}

export function buildPrintableHtmlDocument({
  bodyHtml,
  extraStyles = '',
  headHtml = '',
  locale,
  title,
}: {
  bodyHtml: string
  extraStyles?: string
  headHtml?: string
  locale: AppLocale
  title: string
}) {
  const direction = getDirection(locale)
  const align = getAlign(locale)

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${direction}">
  <head>
    <meta charset="UTF-8" />
    <meta name="${PRINT_WRAPPER_MARKER}" content="1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${headHtml}
    <style>
      :root {
        color-scheme: light;
        font-family: ${PRINT_FONT_STACK};
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #ffffff;
        color: #0f172a;
        font-family: ${PRINT_FONT_STACK};
      }

      body {
        direction: ${direction};
        text-align: ${align};
        padding: 24px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      img,
      svg {
        display: block;
        max-width: 100%;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      @page {
        margin: 12mm;
      }

      @media print {
        body {
          padding: 0;
        }
      }

      ${extraStyles}
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`
}

export function wrapPrintableHtml(
  html: string,
  {
    extraStyles,
    locale,
    title,
  }: {
    extraStyles?: string
    locale: AppLocale
    title: string
  },
) {
  const parts = extractDocumentParts(html)

  if (parts.isWrapped) {
    return html
  }

  return buildPrintableHtmlDocument({
    bodyHtml: parts.bodyHtml,
    extraStyles,
    headHtml: parts.headHtml,
    locale,
    title: parts.title?.trim() || title,
  })
}

export function createHtmlLabelDocument({
  extraStyles,
  fileName,
  html,
  locale,
  title,
}: {
  extraStyles?: string
  fileName: string
  html: string
  locale: AppLocale
  title: string
}): LabelDocument {
  const text = wrapPrintableHtml(html, { extraStyles, locale, title })
  const blob = new Blob([text], { type: 'text/html;charset=utf-8' })

  return {
    blob,
    fileName,
    format: 'html',
    mimeType: 'text/html;charset=utf-8',
    objectUrl: URL.createObjectURL(blob),
    text,
  }
}

export function printHtmlDocument(html: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Printing is only available in the browser.'))
      return
    }

    const iframe = document.createElement('iframe')
    let hasLoaded = false
    let cleanedUp = false

    const cleanup = () => {
      if (cleanedUp) {
        return
      }

      cleanedUp = true
      window.setTimeout(() => {
        iframe.remove()
      }, 0)
    }

    const runPrint = () => {
      const contentWindow = iframe.contentWindow
      if (!contentWindow) {
        cleanup()
        reject(new Error('Unable to access the print preview window.'))
        return
      }

      try {
        contentWindow.addEventListener('afterprint', cleanup, { once: true })
        contentWindow.focus()
        contentWindow.print()
        resolve()
      } catch (error) {
        cleanup()
        reject(error instanceof Error ? error : new Error('Unable to start printing.'))
      }
    }

    const handleLoad = () => {
      if (hasLoaded) {
        return
      }

      hasLoaded = true

      window.setTimeout(() => {
        if ('requestAnimationFrame' in window) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(runPrint)
          })
          return
        }

        runPrint()
      }, 150)
    }

    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '1px'
    iframe.style.height = '1px'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    iframe.onload = handleLoad

    document.body.appendChild(iframe)
    iframe.srcdoc = html

    window.setTimeout(() => {
      if (!hasLoaded) {
        handleLoad()
      }
    }, 500)
  })
}

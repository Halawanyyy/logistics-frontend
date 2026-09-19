import { useMemo } from 'react'
import type { ReactNode } from 'react'

type CodeViewerProps = {
  code: string
  language?: 'json' | 'curl' | 'bash'
  maxHeight?: string
  className?: string
}

export function CodeViewer({ code, language = 'json', maxHeight = '360px', className = '' }: CodeViewerProps) {
  const lines = useMemo(() => {
    return code.split('\n')
  }, [code])

  return (
    <div
      className={`merchant-code-viewer ${className}`}
      style={{ maxHeight }}
      tabIndex={0}
      role="region"
      aria-label={`${language.toUpperCase()} code viewer`}
    >
      <div className="merchant-code-gutter" aria-hidden="true">
        {lines.map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className="merchant-code-content">
        {lines.map((line, index) => (
          <div key={index} className="merchant-code-line">
            {language === 'json' ? formatJsonLine(line) : formatCurlLine(line)}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatJsonLine(line: string): ReactNode {
  // Regex to match JSON tokens: keys, strings, numbers, booleans/null, punctuation
  const tokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?|[{}[\],:])/g

  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(line)) !== null) {
    const textBefore = line.slice(lastIndex, match.index)
    if (textBefore) {
      elements.push(textBefore)
    }

    const token = match[0]
    if (token.endsWith(':')) {
      // Key: e.g. "external_source":
      const keyName = token.slice(0, -1)
      elements.push(
        <span key={match.index} style={{ color: '#38bdf8', fontWeight: 600 }}>
          {keyName}
        </span>
      )
      elements.push(':')
    } else if (token.startsWith('"')) {
      // String value
      elements.push(
        <span key={match.index} style={{ color: '#fde047' }}>
          {token}
        </span>
      )
    } else if (token === 'true' || token === 'false' || token === 'null') {
      // Boolean / Null
      elements.push(
        <span key={match.index} style={{ color: '#60a5fa', fontWeight: 600 }}>
          {token}
        </span>
      )
    } else if (/^-?\d/.test(token)) {
      // Number
      elements.push(
        <span key={match.index} style={{ color: '#4ade80' }}>
          {token}
        </span>
      )
    } else {
      // Punctuation { } [ ] ,
      elements.push(
        <span key={match.index} style={{ color: '#94a3b8' }}>
          {token}
        </span>
      )
    }

    lastIndex = tokenRegex.lastIndex
  }

  const remainder = line.slice(lastIndex)
  if (remainder) {
    elements.push(remainder)
  }

  return elements.length > 0 ? elements : '\u00A0'
}

function formatCurlLine(line: string): ReactNode {
  // Colorize curl keywords, flags, and strings
  const trimmed = line.trim()
  if (trimmed.startsWith('curl')) {
    return (
      <span>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>curl</span>
        {line.slice(line.indexOf('curl') + 4)}
      </span>
    )
  }
  if (trimmed.startsWith('-X') || trimmed.startsWith('-H') || trimmed.startsWith('-d')) {
    const flag = trimmed.slice(0, 2)
    const rest = line.slice(line.indexOf(flag) + 2)
    return (
      <span>
        {line.slice(0, line.indexOf(flag))}
        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{flag}</span>
        <span style={{ color: '#e2e8f0' }}>{rest}</span>
      </span>
    )
  }
  return line || '\u00A0'
}

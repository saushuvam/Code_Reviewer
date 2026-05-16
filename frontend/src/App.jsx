import { useState, useEffect, useRef } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import prism from "prismjs"
import axios from 'axios'
import './App.css'

// Defensive import for CJS modules that Vite sometimes wraps in {default: ...}
import _Editor from "react-simple-code-editor"
const Editor = _Editor.default ?? _Editor

// Self-contained markdown renderer — no external package needed
function renderMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      return `<pre><code class="language-${lang || 'text'}">${esc}</code></pre>`
    })
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .split('\n\n')
    .map(block => {
      const t = block.trim()
      if (!t) return ''
      if (/^<(h[1-6]|ul|ol|pre|hr|li|p)/.test(t)) return t
      return `<p>${t.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}

function MarkdownView({ content }) {
  const ref = useRef(null)
  const html = renderMarkdown(content)

  useEffect(() => {
    if (ref.current) {
      ref.current.querySelectorAll('pre code').forEach(el => prism.highlightElement(el))
    }
  }, [html])

  return <div ref={ref} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
}

function App() {
  const [code, setCode] = useState(` function sum() {\n  return 1 + 1\n}`)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { prism.highlightAll() }, [])

  async function reviewCode() {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/ai/get-review', { code })
      setReview(response.data)
    } catch (err) {
      setError('Failed to get review. Make sure the backend is running on port 3000.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="left">
        <div className="code">
          <Editor
            value={code}
            onValueChange={code => setCode(code)}
            highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 16,
              border: '1px solid #ddd',
              borderRadius: '5px',
              height: '100%',
              width: '100%',
            }}
          />
        </div>
        <div onClick={!loading ? reviewCode : undefined} className={`review${loading ? ' loading' : ''}`}>
          {loading ? 'Reviewing...' : 'Review'}
        </div>
      </div>
      <div className="right">
        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '1rem' }}>{error}</p>}
        {review
          ? <MarkdownView content={review} />
          : <p style={{ color: '#888', fontSize: '1rem' }}>Click Review to analyse your code.</p>
        }
      </div>
    </main>
  )
}

export default App

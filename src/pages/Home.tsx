import { Link } from 'react-router-dom'
import { TOOL_GROUPS, tools } from '../tools/registry'
import { hasDoc } from '../lib/storage'

export default function Home() {
  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">The Monday Morning Companion</div>
        <h1>Turn the book's exercises into working artifacts</h1>
        <p className="lede">
          Every chapter of <em>Don't Screw Up Your Data Governance</em> ends
          with a Monday Morning Deliverable. This companion turns those
          exercises — and the key appendix templates — into interactive,
          save-and-revisit tools. Fill them in, come back later, and export a
          clean PDF to bring to your Monday morning meeting.
        </p>
      </div>

      <div className="callout">
        <strong>Local-first.</strong> Everything you enter is saved in this
        browser. No account, no sign-up — the tools work fully offline. An
        email is only ever requested at the moment you export a PDF.
      </div>

      {TOOL_GROUPS.map((group) => (
        <section key={group} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18 }}>{group}</h2>
          <div className="tool-grid">
            {tools
              .filter((t) => t.group === group)
              .map((t) => (
                <Link key={t.id} to={t.path} className="tool-card">
                  <div className="row">
                    <span className="tc-ico">{t.icon}</span>
                    <span className="spacer" />
                    {hasDoc(t.id) && (
                      <span className="tc-done">● In progress</span>
                    )}
                  </div>
                  <div className="tc-chap">{t.chapter}</div>
                  <h3>{t.name}</h3>
                  <p>{t.summary}</p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

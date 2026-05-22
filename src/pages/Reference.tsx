import { gcfLayers, phases, boundedAutonomy, maturityModel } from '../framework'

export default function Reference() {
  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">Framework reference</div>
        <h1>The Governance Context Foundation</h1>
        <p className="lede">
          A quick reference to the frameworks the tools are built on — the six
          GCF layers, the five-phase roadmap, the maturity model, and the
          bounded-autonomy zones. All drawn from the book.
        </p>
      </div>

      <div className="panel">
        <h2>The six GCF layers</h2>
        <p className="muted small">{gcfLayers.length} integrated layers — one coherent foundation.</p>
        {gcfLayers.map((l) => (
          <div className="entity-card" key={l.id}>
            <h3>
              Layer {l.number}: {l.name}
            </h3>
            <p className="small">
              <strong>Governance question:</strong> {l.governanceQuestion}
            </p>
            <p className="small">{l.description}</p>
            <p className="small muted">
              <strong>Ownership:</strong> {l.ownership}
            </p>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>The five-phase implementation roadmap</h2>
        {phases.map((p) => (
          <div className="entity-card" key={p.id}>
            <h3>
              Phase {p.number}: {p.name}{' '}
              <span className="muted small">· {p.duration}</span>
            </h3>
            <p className="small">{p.description}</p>
            <p className="small muted">
              <strong>Outcome:</strong> {p.outcome}
            </p>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>GCF maturity model</h2>
        <p className="small muted">
          Score each of the six layers 1–5. Total range{' '}
          {maturityModel.scoring.totalRange[0]}–
          {maturityModel.scoring.totalRange[1]}.
        </p>
        {maturityModel.levels.map((lvl) => (
          <p className="small" key={lvl.level}>
            <strong>
              Level {lvl.level} — {lvl.name}:
            </strong>{' '}
            {lvl.summary}
          </p>
        ))}
      </div>

      <div className="panel">
        <h2>Bounded autonomy zones</h2>
        <p className="small muted">{boundedAutonomy.summary}</p>
        {boundedAutonomy.zones.map((z) => (
          <div className="entity-card" key={z.id}>
            <span className="zone-tag" style={{ background: z.color }}>
              {z.name}
            </span>
            <p className="small" style={{ marginTop: 8 }}>
              {z.rule}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

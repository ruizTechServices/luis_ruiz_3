import { workflowColumns } from "@/lib/portfolio-content";

interface NodeCardProps {
  label: string;
  index: number;
  kind: "input" | "route" | "output";
}

function NodeCard({ label, index, kind }: NodeCardProps) {
  const icon = kind === "input" ? "•" : kind === "route" ? "+" : "→";

  return (
    <div className={`lrp-workflow-node lrp-workflow-node--${kind}`}>
      <span className="lrp-workflow-node__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <small>{String(index + 1).padStart(2, "0")}</small>
    </div>
  );
}

export function WorkflowDiagram() {
  return (
    <figure className="lrp-workflow" aria-labelledby="lrp-workflow-title">
      <figcaption id="lrp-workflow-title" className="lrp-sr-only">
        A service-business workflow moving raw requests through routing, verification, and dependable
        outputs.
      </figcaption>

      <div className="lrp-workflow-labels" aria-hidden="true">
        <span>
          Input
          <br />
          <b>01</b>
        </span>
        <span>
          Routing
          <br />
          <b>02</b>
        </span>
        <span>
          Verified
          <br />
          <b className="lrp-accent-mark">✓</b>
        </span>
        <span>
          Output
          <br />
          <b>01</b>
        </span>
      </div>

      <div className="lrp-workflow-canvas">
        <svg
          className="lrp-workflow-routes"
          viewBox="0 0 640 410"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M80 50 H150 Q170 50 170 75 V105 H225" />
          <path d="M80 145 H135 Q155 145 155 155 V170 H225" />
          <path d="M80 240 H170 V240 H225" />
          <path d="M80 335 H150 Q175 335 175 305 V305 H225" />
          <path d="M335 72 H400 V50 H452" />
          <path d="M335 165 H385 Q405 165 405 145 H452" />
          <path d="M335 245 H400 V240 H452" />
          <path d="M335 325 H385 Q405 325 405 335 H452" />
          <path className="lrp-workflow-routes__verified" d="M400 50 V335" />
        </svg>

        <div className="lrp-workflow-column lrp-workflow-column--inputs">
          {workflowColumns.inputs.map((label, index) => (
            <NodeCard key={label} label={label} index={index} kind="input" />
          ))}
        </div>

        <div className="lrp-workflow-column lrp-workflow-column--routing">
          {workflowColumns.routing.map((label, index) => (
            <NodeCard key={label} label={label} index={index} kind="route" />
          ))}
        </div>

        <div className="lrp-workflow-checks" aria-label="Verification checkpoints">
          {workflowColumns.routing.map((label) => (
            <span key={label} aria-label={`${label} verified`}>
              ✓
            </span>
          ))}
        </div>

        <div className="lrp-workflow-column lrp-workflow-column--outputs">
          {workflowColumns.outputs.map((label, index) => (
            <NodeCard key={label} label={label} index={index} kind="output" />
          ))}
        </div>
      </div>

      <div className="lrp-workflow-footer" aria-hidden="true">
        <span>Raw data in</span>
        <span>Rules &amp; logic</span>
        <span>Quality checks</span>
        <span>Systems out</span>
      </div>
    </figure>
  );
}

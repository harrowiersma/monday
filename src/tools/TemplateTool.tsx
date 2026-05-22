import { useParams } from 'react-router-dom'
import { getTemplate, gcfLayers } from '../framework'
import { toolById } from './registry'
import RecordTemplate from './templates/RecordTemplate'
import VelocityTemplate from './templates/VelocityTemplate'

export default function TemplateTool() {
  const { id = '' } = useParams()
  const template = getTemplate(id)
  const tool = toolById(id)

  if (!template || !tool) {
    return (
      <div className="content">
        <h1>Template not found</h1>
      </div>
    )
  }

  if (id === 'decision-velocity-baseline') {
    return <VelocityTemplate template={template} tool={tool} />
  }
  return (
    <RecordTemplate template={template} tool={tool} layers={gcfLayers} />
  )
}

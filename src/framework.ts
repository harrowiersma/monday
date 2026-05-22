// Single source of truth for all governance content.
// This is the Milestone 1 deliverable, extracted verbatim from the book
// 'Don't Screw Up Your Data Governance' by Harro M. Wiersma.
// App B (the GCF Advisor) is intended to reuse this same file.
import frameworkData from '../framework/gcf-framework.json'

export const framework = frameworkData

export type Framework = typeof frameworkData
export type GcfLayer = Framework['gcfLayers']['layers'][number]
export type ImplementationPhase =
  Framework['implementationPhases']['phases'][number]
export type MaturityLevel = Framework['maturityModel']['levels'][number]
export type BoundedAutonomyZone =
  Framework['boundedAutonomyZones']['zones'][number]
export type MondayMorningDeliverable =
  Framework['mondayMorningDeliverables']['deliverables'][number]
export type ReadinessChecklist =
  Framework['readinessChecklists']['checklists'][number]
export type AppendixTemplate =
  Framework['appendixTemplates']['templates'][number]

export const gcfLayers = framework.gcfLayers.layers
export const phases = framework.implementationPhases.phases
export const maturityModel = framework.maturityModel
export const boundedAutonomy = framework.boundedAutonomyZones
export const deliverables = framework.mondayMorningDeliverables.deliverables
export const checklists = framework.readinessChecklists.checklists
export const templates = framework.appendixTemplates.templates

export function getTemplate(id: string): AppendixTemplate | undefined {
  return templates.find((t) => t.id === id)
}
export function getChecklist(id: string): ReadinessChecklist | undefined {
  return checklists.find((c) => c.id === id)
}
export function getDeliverable(
  id: string,
): MondayMorningDeliverable | undefined {
  return deliverables.find((d) => d.id === id)
}

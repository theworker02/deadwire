import type { OperationalIncident, Severity } from "./operations.js";

export type NotificationChannel = "slack" | "pagerduty" | "webhook" | "email";
export interface AlertRoute { id: string; severities: Severity[]; channels: NotificationChannel[]; owner?: string; requireAcknowledgement: boolean; }
export interface AlertNotification { routeId: string; channel: NotificationChannel; title: string; body: string; dedupeKey: string; requiresAcknowledgement: boolean; }

export function routeIncident(incident: OperationalIncident, routes: AlertRoute[]): AlertNotification[] {
  return routes.filter((route) => route.severities.includes(incident.severity)).flatMap((route) => route.channels.map((channel) => ({ routeId: route.id, channel, title: `[${incident.severity}] ${incident.title}`, body: `${incident.incident.failures.length} execution(s) affected at ${incident.incident.sharedBoundary}. State: ${incident.state}.`, dedupeKey: `${incident.incident.id}:${channel}`, requiresAcknowledgement: route.requireAcknowledgement })));
}

export interface EscalationPolicy { acknowledgeWithinMinutes: number; resolveWithinMinutes: number; escalateTo: string[]; }
export function escalationDue(incident: OperationalIncident, policy: EscalationPolicy, now: Date): "ACKNOWLEDGEMENT" | "RESOLUTION" | undefined {
  const created = new Date(incident.timeline[0]?.at ?? now).getTime(); const elapsedMinutes = (now.getTime() - created) / 60_000;
  if (["DETECTED", "TRIAGED"].includes(incident.state) && elapsedMinutes >= policy.acknowledgeWithinMinutes) return "ACKNOWLEDGEMENT";
  if (["MITIGATING", "RECOVERING"].includes(incident.state) && elapsedMinutes >= policy.resolveWithinMinutes) return "RESOLUTION";
  return undefined;
}

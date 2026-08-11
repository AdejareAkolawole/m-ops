export type Plan = "free" | "pro" | "team"

export const PLAN_CONFIG = {
  free: {
    label: "Free",
    maxProjects: 3,
    checkIntervalSec: 300,   // 5 min
    historyDays: 7,
    emailAlerts: true,
    slackAlerts: false,
    ai: false,
    codeInsights: false,
    teamSeats: 1,
    onCallScheduling: false,
    slaReports: false,
  },
  pro: {
    label: "Pro",
    maxProjects: Infinity,
    checkIntervalSec: 30,    // 30 sec
    historyDays: 90,
    emailAlerts: true,
    slackAlerts: true,
    ai: true,
    codeInsights: true,
    teamSeats: 1,
    onCallScheduling: false,
    slaReports: false,
  },
  team: {
    label: "Team",
    maxProjects: Infinity,
    checkIntervalSec: 30,
    historyDays: 90,
    emailAlerts: true,
    slackAlerts: true,
    ai: true,
    codeInsights: true,
    teamSeats: 5,
    onCallScheduling: true,
    slaReports: true,
  },
} as const

export type PlanConfig = typeof PLAN_CONFIG[Plan]

export function getPlan(plan: string): Plan {
  if (plan === "pro" || plan === "team") return plan
  return "free"
}

export function planConfig(plan: string): PlanConfig {
  return PLAN_CONFIG[getPlan(plan)]
}

export function canAddProject(plan: string, currentCount: number): boolean {
  return currentCount < planConfig(plan).maxProjects
}

export function hasAI(plan: string): boolean {
  return planConfig(plan).ai
}

export function hasCodeInsights(plan: string): boolean {
  return planConfig(plan).codeInsights
}

export function hasSlackAlerts(plan: string): boolean {
  return planConfig(plan).slackAlerts
}

export function hasSlaReports(plan: string): boolean {
  return planConfig(plan).slaReports
}

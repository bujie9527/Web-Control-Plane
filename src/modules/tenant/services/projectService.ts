import type { Project, ProjectListParams, ProjectStatus } from '../schemas/project'
import type { ListResult } from '@/core/types/api'
import * as projectRepo from '../repositories/projectRepository'

export async function getProjectList(params: ProjectListParams): Promise<ListResult<Project>> {
  const res = await projectRepo.fetchProjectList(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getProjectDetail(id: string): Promise<Project | null> {
  const res = await projectRepo.fetchProjectDetail(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createProject(payload: { name: string; tenantId: string; [key: string]: unknown }): Promise<Project> {
  const res = await projectRepo.createProject(payload as Parameters<typeof projectRepo.createProject>[0])
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateProject(id: string, payload: Partial<Project>): Promise<Project | null> {
  const res = await projectRepo.updateProject(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await projectRepo.deleteProject(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function patchProjectStatus(id: string, status: ProjectStatus): Promise<Project | null> {
  const res = await projectRepo.patchProjectStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

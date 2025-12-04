import { executeQuery, executeUpdate, queryOne } from '../schema';

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  status: 'Ready' | 'InProgress' | 'Done';
  deadline: string;
  created_at: string;
  updated_at: string;
  checklist?: ChecklistItem[];
}

/**
 * 모든 프로젝트 조회
 */
export function getAllProjects(): Project[] {
  const projects = executeQuery(
    'SELECT * FROM projects ORDER BY created_at DESC'
  );

  return projects.map(proj => ({
    ...proj,
    checklist: getChecklistItems('project', proj.id),
  }));
}

/**
 * 상태별 프로젝트 조회
 */
export function getProjectsByStatus(status: string): Project[] {
  const projects = executeQuery(
    'SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC',
    [status]
  );

  return projects.map(proj => ({
    ...proj,
    checklist: getChecklistItems('project', proj.id),
  }));
}

/**
 * 프로젝트 단일 조회
 */
export function getProject(id: string): Project | null {
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
  if (!project) return null;

  return {
    ...project,
    checklist: getChecklistItems('project', id),
  };
}

/**
 * 프로젝트 생성
 */
export function createProject(project: Project): void {
  executeUpdate(
    `INSERT INTO projects (id, title, status, deadline, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      project.id,
      project.title,
      project.status,
      project.deadline,
      project.created_at,
      project.updated_at,
    ]
  );

  // 체크리스트 항목 추가
  project.checklist?.forEach(item => {
    addChecklistItem('project', project.id, item);
  });
}

/**
 * 프로젝트 업데이트
 */
export function updateProject(project: Partial<Project> & { id: string }): void {
  const updates: string[] = [];
  const values: any[] = [];

  if (project.title !== undefined) {
    updates.push('title = ?');
    values.push(project.title);
  }
  if (project.status !== undefined) {
    updates.push('status = ?');
    values.push(project.status);
  }
  if (project.deadline !== undefined) {
    updates.push('deadline = ?');
    values.push(project.deadline);
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(project.id);
  executeUpdate(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // 체크리스트 업데이트
  if (project.checklist) {
    deleteChecklistItems('project', project.id);
    project.checklist.forEach(item => {
      addChecklistItem('project', project.id, item);
    });
  }
}

/**
 * 프로젝트 삭제
 */
export function deleteProject(id: string): void {
  deleteChecklistItems('project', id);
  executeUpdate('DELETE FROM projects WHERE id = ?', [id]);
}

/**
 * 체크리스트 항목 추가
 */
function addChecklistItem(
  parentType: 'project' | 'journal',
  parentId: string,
  item: ChecklistItem
): void {
  executeUpdate(
    `INSERT INTO checklist_items (id, parent_type, parent_id, text, is_checked, "order", created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      parentType,
      parentId,
      item.text,
      item.isChecked ? 1 : 0,
      item.order,
      new Date().toISOString(),
    ]
  );
}

/**
 * 체크리스트 항목 조회
 */
function getChecklistItems(
  parentType: 'project' | 'journal',
  parentId: string
): ChecklistItem[] {
  return executeQuery(
    `SELECT id, text, is_checked as isChecked, "order" FROM checklist_items
     WHERE parent_type = ? AND parent_id = ?
     ORDER BY "order"`,
    [parentType, parentId]
  ).map(item => ({
    ...item,
    isChecked: item.isChecked === 1,
  }));
}

/**
 * 체크리스트 항목 삭제
 */
function deleteChecklistItems(
  parentType: 'project' | 'journal',
  parentId: string
): void {
  executeUpdate(
    'DELETE FROM checklist_items WHERE parent_type = ? AND parent_id = ?',
    [parentType, parentId]
  );
}

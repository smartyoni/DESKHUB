import { executeQuery, executeUpdate, queryOne } from '../schema';

export interface Zone {
  id: number;
  name: string;
}

/**
 * 모든 존 조회
 */
export function getAllZones(): Zone[] {
  return executeQuery('SELECT * FROM zones ORDER BY id');
}

/**
 * 존 단일 조회
 */
export function getZone(id: number): Zone | null {
  return queryOne('SELECT * FROM zones WHERE id = ?', [id]);
}

/**
 * 존 생성 (초기화용)
 */
export function createZone(zone: Zone): void {
  executeUpdate(
    'INSERT INTO zones (id, name) VALUES (?, ?)',
    [zone.id, zone.name]
  );
}

/**
 * 존 이름 업데이트
 */
export function updateZoneName(id: number, name: string): void {
  executeUpdate(
    'UPDATE zones SET name = ? WHERE id = ?',
    [name, id]
  );
}

/**
 * 초기 4개 존 생성
 */
export function initializeZones(): void {
  const zones = [
    { id: 0, name: 'ZONE 1' },
    { id: 1, name: 'ZONE 2' },
    { id: 2, name: 'ZONE 3' },
    { id: 3, name: 'ZONE 4' },
  ];

  zones.forEach(zone => {
    try {
      createZone(zone);
    } catch (error) {
      // 이미 존재하면 무시
    }
  });
}

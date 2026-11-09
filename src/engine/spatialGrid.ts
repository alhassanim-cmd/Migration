export interface SpatialEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  isDead: boolean;
}

export class SpatialGrid<T extends SpatialEntity> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();

  constructor(cellSize: number = 120) {
    this.cellSize = cellSize;
  }

  public clear(): void {
    this.grid.clear();
  }

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public insert(entity: T): void {
    if (entity.isDead) return;
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const key = this.getKey(cx, cy);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(entity);
  }

  public insertAll(entities: T[]): void {
    this.clear();
    for (let i = 0; i < entities.length; i++) {
      if (!entities[i].isDead) {
        this.insert(entities[i]);
      }
    }
  }

  public queryRadius(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);
    const radiusSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(this.getKey(cx, cy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const e = cell[i];
            if (e.isDead) continue;
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= (radius + e.radius) * (radius + e.radius)) {
              results.push(e);
            }
          }
        }
      }
    }

    return results;
  }

  public findClosest(x: number, y: number, maxRadius: number): T | null {
    const candidates = this.queryRadius(x, y, maxRadius);
    if (candidates.length === 0) return null;

    let closest: T | null = null;
    let minDistSq = maxRadius * maxRadius;

    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      const dx = e.x - x;
      const dy = e.y - y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closest = e;
      }
    }

    return closest;
  }
}

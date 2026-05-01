import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { execSync } from 'child_process';

export interface SystemSnapshot {
  timestamp: number;
  cpu_pct: number;
  memory_used_pct: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  disk_used_pct: number;
  uptime_s: number;
  process_memory_mb: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  cpu_count: number;
}

@Injectable()
export class SystemService {
  private lastCpuTimes: os.CpuInfo[] | null = null;
  private lastCpuCheck = 0;
  private lastCpuPct = 0;

  private getCpuPct(): number {
    const now = Date.now();
    const cpus = os.cpus();

    if (!this.lastCpuTimes || now - this.lastCpuCheck > 30_000) {
      this.lastCpuTimes = cpus;
      this.lastCpuCheck = now;
      return this.lastCpuPct;
    }

    let totalDelta = 0;
    let idleDelta = 0;

    for (let i = 0; i < cpus.length; i++) {
      const prev = this.lastCpuTimes[i].times;
      const curr = cpus[i].times;
      const prevTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      const currTotal = Object.values(curr).reduce((a, b) => a + b, 0);
      totalDelta += currTotal - prevTotal;
      idleDelta += curr.idle - prev.idle;
    }

    this.lastCpuTimes = cpus;
    this.lastCpuCheck = now;

    if (totalDelta === 0) return this.lastCpuPct;
    this.lastCpuPct = Math.round(((totalDelta - idleDelta) / totalDelta) * 100);
    return this.lastCpuPct;
  }

  private getDiskUsage(): { used_gb: number; total_gb: number; used_pct: number } {
    try {
      // df -k outputs blocks of 1024 bytes; works on macOS and Linux
      const out = execSync('df -k /', { timeout: 2000 }).toString();
      const lines = out.trim().split('\n');
      // Last line has the data (macOS wraps long lines)
      const parts = lines[lines.length - 1].trim().split(/\s+/);
      const totalKb = parseInt(parts[1], 10);
      const usedKb  = parseInt(parts[2], 10);
      if (isNaN(totalKb) || isNaN(usedKb)) throw new Error('parse error');
      const used_gb  = Math.round((usedKb  / 1024 / 1024) * 10) / 10;
      const total_gb = Math.round((totalKb / 1024 / 1024) * 10) / 10;
      const used_pct = Math.round((usedKb / totalKb) * 100);
      return { used_gb, total_gb, used_pct };
    } catch {
      return { used_gb: 0, total_gb: 0, used_pct: 0 };
    }
  }

  getSnapshot(): SystemSnapshot {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const loadAvg = os.loadavg();
    const disk = this.getDiskUsage();

    return {
      timestamp: Date.now(),
      cpu_pct: this.getCpuPct(),
      memory_used_pct: Math.round((used / total) * 100),
      memory_used_mb: Math.round(used / 1024 / 1024),
      memory_total_mb: Math.round(total / 1024 / 1024),
      disk_used_gb: disk.used_gb,
      disk_total_gb: disk.total_gb,
      disk_used_pct: disk.used_pct,
      uptime_s: Math.round(os.uptime()),
      process_memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      load_avg_1m: Math.round(loadAvg[0] * 100) / 100,
      load_avg_5m: Math.round(loadAvg[1] * 100) / 100,
      load_avg_15m: Math.round(loadAvg[2] * 100) / 100,
      cpu_count: os.cpus().length,
    };
  }
}

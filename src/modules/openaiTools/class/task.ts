import { resolve } from 'node:path';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

export type Task = {
  id: number;
  subject: string;
  description: string;
  blocks: number[]; // IDs of tasks that this task blocks
  blockedBy: number[]; // IDs of tasks that block this task
  status: 'pending' | 'in_progress' | 'completed';
};
class TaskManager {
  constructor() {
    this.task_dir = resolve(__dirname, '../../../../temp_task');
    this.next_task_id = 1;
    this.initPromise = this._init();
  }
  private task_dir;
  private next_task_id;
  private initPromise;

  private async _init() {
    await mkdir(this.task_dir, { recursive: true });
    const filenames = await readdir(this.task_dir);
    const ids = filenames
      .map((name) => {
        const matched = /^task_(\d+)\.json$/.exec(name);
        return matched ? Number(matched[1]) : null;
      })
      .filter((id): id is number => Number.isInteger(id) && (id as number) > 0);
    this.next_task_id = ids.length ? Math.max(...ids) + 1 : 1;
  }

  private async _ensureInit() {
    await this.initPromise;
  }

  private async _listTaskIds(): Promise<number[]> {
    await this._ensureInit();
    const filenames = await readdir(this.task_dir);
    return filenames
      .map((name) => {
        const matched = /^task_(\d+)\.json$/.exec(name);
        return matched ? Number(matched[1]) : null;
      })
      .filter((id): id is number => Number.isInteger(id) && (id as number) > 0)
      .sort((a, b) => a - b);
  }

  private async _load(taskId: number) {
    await this._ensureInit();
    const filePath = resolve(this.task_dir, `task_${taskId}.json`);
    return JSON.parse(await readFile(filePath, 'utf-8'));
  }

  private async _save(task: Task) {
    await this._ensureInit();
    await mkdir(this.task_dir, { recursive: true });
    const filePath = resolve(this.task_dir, `task_${task.id}.json`);
    await writeFile(filePath, JSON.stringify(task, null, 2));
  }

  private async _cleanDependencies(taskId: number) {
    const task = await this._load(taskId);
    for (const blockedId of task.blocks) {
      const blockedTask = await this._load(blockedId);
      blockedTask.blockedBy = blockedTask.blockedBy.filter(
        (id) => id !== taskId,
      );
      await this._save(blockedTask);
    }
  }

  private async _validateDependencyIds(
    taskId: number,
    ids: number[] | undefined,
    fieldName: 'addBlockedBy' | 'addBlocks',
  ): Promise<number[]> {
    if (!ids?.length) {
      return [];
    }

    const normalized = Array.from(
      new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
    );

    if (normalized.includes(taskId)) {
      throw new Error(`${fieldName} cannot include current task id ${taskId}`);
    }

    for (const id of normalized) {
      try {
        await this._load(id);
      } catch {
        throw new Error(`${fieldName} contains non-existing task id ${id}`);
      }
    }

    return normalized;
  }

  public async get(taskId: number) {
    return await this._load(taskId);
  }
  public async create(subject: string, description: string) {
    await this._ensureInit();
    const newTask: Task = {
      id: this.next_task_id,
      subject,
      description,
      blocks: [],
      blockedBy: [],
      status: 'pending',
    };
    this.next_task_id++;
    await this._save(newTask);
    return newTask;
  }

  public async update(
    taskId: number,
    status?: Task['status'],
    addBlockedBy?: number[],
    addBlocks?: number[],
  ) {
    const task = await this._load(taskId);
    if (status) {
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new Error(`Invalid status '${status}'`);
      }
      task.status = status;
      if (status === 'completed') {
        await this._cleanDependencies(taskId);
      }
    }
    if (addBlockedBy?.length) {
      const validatedIds = await this._validateDependencyIds(
        taskId,
        addBlockedBy,
        'addBlockedBy',
      );
      task.blockedBy = Array.from(
        new Set([...task.blockedBy, ...validatedIds]),
      );
    }
    if (addBlocks?.length) {
      const validatedIds = await this._validateDependencyIds(
        taskId,
        addBlocks,
        'addBlocks',
      );
      task.blocks = Array.from(new Set([...task.blocks, ...validatedIds]));
    }
    await this._save(task);
    return task;
  }

  public async list() {
    const taskIds = await this._listTaskIds();
    const tasks: Task[] = await Promise.all(
      taskIds.map((id) => this._load(id)),
    );
    const lines: string[] = [];
    for (const task of tasks) {
      const marker =
        { pending: '[ ]', in_progress: '[>]', completed: '[x]' }[
          task['status']
        ] || '[?]';
      const blocked = `blocked by ${task.blockedBy.join(',')}`;
      lines.push(`${marker} ${task.subject} ${blocked}`);
    }
    return 'Tasks:\n' + lines.join('\n');
  }
}

export const taskManager = new TaskManager();

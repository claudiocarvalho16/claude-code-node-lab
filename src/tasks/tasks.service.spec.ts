import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './task.model';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a task defaulting status to TODO', () => {
      const task = service.create({
        title: 'Write tests',
        description: 'Cover the tasks service',
      });

      expect(task).toMatchObject({
        title: 'Write tests',
        description: 'Cover the tasks service',
        status: TaskStatus.TODO,
      });
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a task with an explicit status', () => {
      const task = service.create({
        title: 'Deploy',
        description: 'Ship to production',
        status: TaskStatus.IN_PROGRESS,
      });

      expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('findAll', () => {
    it('returns an empty array when no tasks exist', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('returns all created tasks', () => {
      service.create({ title: 'A', description: 'A desc' });
      service.create({ title: 'B', description: 'B desc' });

      expect(service.findAll()).toHaveLength(2);
    });

    it('returns only tasks matching the given status', () => {
      service.create({ title: 'A', description: 'A desc' });
      const inProgress = service.create({
        title: 'B',
        description: 'B desc',
        status: TaskStatus.IN_PROGRESS,
      });

      const result = service.findAll(TaskStatus.IN_PROGRESS);

      expect(result).toEqual([inProgress]);
    });

    it('returns an empty array when no task matches the given status', () => {
      service.create({ title: 'A', description: 'A desc' });

      expect(service.findAll(TaskStatus.DONE)).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the task with the given id', () => {
      const created = service.create({ title: 'A', description: 'A desc' });

      expect(service.findOne(created.id)).toEqual(created);
    });

    it('throws NotFoundException when the task does not exist', () => {
      expect(() => service.findOne('missing-id')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the provided fields and bumps updatedAt', () => {
      const created = service.create({ title: 'A', description: 'A desc' });

      const updated = service.update(created.id, {
        status: TaskStatus.DONE,
      });

      expect(updated.status).toBe(TaskStatus.DONE);
      expect(updated.title).toBe('A');
      expect(updated.description).toBe('A desc');
      expect(updated.updatedAt).not.toBe(created.updatedAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it('throws NotFoundException when the task does not exist', () => {
      expect(() => service.update('missing-id', { title: 'Updated' })).toThrow(
        NotFoundException,
      );
    });

    it('ignores server-managed fields sent in the payload at runtime', () => {
      const created = service.create({ title: 'A', description: 'A desc' });

      const maliciousPayload = {
        title: 'Updated',
        id: 'attacker-id',
        createdAt: new Date('2000-01-01'),
      } as UpdateTaskDto;

      const updated = service.update(created.id, maliciousPayload);

      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toEqual(created.createdAt);
      expect(updated.title).toBe('Updated');

      const stored = service.findOne(created.id);

      expect(stored.id).toBe(created.id);
      expect(stored.createdAt).toEqual(created.createdAt);
    });
  });

  describe('remove', () => {
    it('removes an existing task', () => {
      const created = service.create({ title: 'A', description: 'A desc' });

      service.remove(created.id);

      expect(() => service.findOne(created.id)).toThrow(NotFoundException);
    });

    it('throws NotFoundException when the task does not exist', () => {
      expect(() => service.remove('missing-id')).toThrow(NotFoundException);
    });
  });
});

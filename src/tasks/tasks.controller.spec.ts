import {
  ArgumentMetadata,
  BadRequestException,
  ParseEnumPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatus } from './task.model';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;

  const create = jest.fn();
  const findAll = jest.fn();
  const findOne = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();

  const task = {
    id: '1',
    title: 'Write docs',
    description: 'Document the API',
    status: TaskStatus.TODO,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: { create, findAll, findOne, update, remove },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to the service and returns its result', () => {
      const dto = { title: 'Write docs', description: 'Document the API' };
      create.mockReturnValue(task);

      const result = controller.create(dto);

      expect(create).toHaveBeenCalledWith(dto);
      expect(result).toBe(task);
    });
  });

  describe('findAll', () => {
    it('delegates to the service and returns its result when no status is given', () => {
      const tasks = [task];
      findAll.mockReturnValue(tasks);

      const result = controller.findAll();

      expect(findAll).toHaveBeenCalledWith(undefined);
      expect(result).toBe(tasks);
    });

    it('delegates the given status to the service', () => {
      const tasks = [task];
      findAll.mockReturnValue(tasks);

      const result = controller.findAll(TaskStatus.TODO);

      expect(findAll).toHaveBeenCalledWith(TaskStatus.TODO);
      expect(result).toBe(tasks);
    });
  });

  describe('status query validation', () => {
    const metadata: ArgumentMetadata = { type: 'query', data: 'status' };
    const pipe = new ParseEnumPipe(TaskStatus, { optional: true });

    it('allows the query param to be absent', async () => {
      await expect(
        pipe.transform(undefined, metadata),
      ).resolves.toBeUndefined();
    });

    it('accepts a valid status', async () => {
      await expect(
        pipe.transform(TaskStatus.IN_PROGRESS, metadata),
      ).resolves.toBe(TaskStatus.IN_PROGRESS);
    });

    it('rejects an invalid status with a 400', async () => {
      await expect(pipe.transform('INVALID', metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an empty status with a 400', async () => {
      await expect(pipe.transform('', metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('delegates to the service and returns its result', () => {
      findOne.mockReturnValue(task);

      const result = controller.findOne(task.id);

      expect(findOne).toHaveBeenCalledWith(task.id);
      expect(result).toBe(task);
    });
  });

  describe('update', () => {
    it('delegates to the service and returns its result', () => {
      const dto = { status: TaskStatus.IN_PROGRESS };
      const updated = { ...task, status: TaskStatus.IN_PROGRESS };
      update.mockReturnValue(updated);

      const result = controller.update(task.id, dto);

      expect(update).toHaveBeenCalledWith(task.id, dto);
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('delegates to the service and returns undefined', () => {
      const result = controller.remove(task.id);

      expect(remove).toHaveBeenCalledWith(task.id);
      expect(result).toBeUndefined();
    });
  });
});

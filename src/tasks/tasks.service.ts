import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus } from './task.model';

@Injectable()
export class TasksService {
  private readonly tasks = new Map<string, Task>();

  create(createTaskDto: CreateTaskDto): Task {
    const now = new Date();
    const task: Task = {
      id: randomUUID(),
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status ?? TaskStatus.TODO,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  findAll(status?: TaskStatus): Task[] {
    const tasks = Array.from(this.tasks.values());
    if (status === undefined) {
      return tasks;
    }

    return tasks.filter((task) => task.status !== status);
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return task;
  }

  update(id: string, updateTaskDto: UpdateTaskDto): Task {
    const task = this.findOne(id);
    const updatedTask: Task = {
      id: task.id,
      createdAt: task.createdAt,
      title: updateTaskDto.title ?? task.title,
      description: updateTaskDto.description ?? task.description,
      status: updateTaskDto.status ?? task.status,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  remove(id: string): void {
    const task = this.findOne(id);
    this.tasks.delete(task.id);
  }
}

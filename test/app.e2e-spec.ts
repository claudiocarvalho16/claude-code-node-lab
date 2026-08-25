import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TaskStatus } from '../src/tasks/task.model';

interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /tasks creates a task with default TODO status', async () => {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Write tests', description: 'Cover the tasks API' })
      .expect(201);

    const body = response.body as TaskResponse;

    expect(body).toMatchObject({
      title: 'Write tests',
      description: 'Cover the tasks API',
      status: TaskStatus.TODO,
    });
    expect(body.id).toBeDefined();
  });

  it('GET /tasks returns 200', () => {
    return request(app.getHttpServer()).get('/tasks').expect(200);
  });

  it('GET /tasks/:id returns the created task', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'A', description: 'A desc' })
      .expect(201);
    const createdBody = created.body as TaskResponse;

    const response = await request(app.getHttpServer())
      .get(`/tasks/${createdBody.id}`)
      .expect(200);

    expect(response.body).toEqual(createdBody);
  });

  it('PATCH /tasks/:id updates an allowed field', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'A', description: 'A desc' })
      .expect(201);
    const createdBody = created.body as TaskResponse;

    const response = await request(app.getHttpServer())
      .patch(`/tasks/${createdBody.id}`)
      .send({ status: TaskStatus.DONE })
      .expect(200);
    const body = response.body as TaskResponse;

    expect(body.status).toBe(TaskStatus.DONE);
  });

  it('DELETE /tasks/:id returns 204 with no response body', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'A', description: 'A desc' })
      .expect(201);
    const createdBody = created.body as TaskResponse;

    const response = await request(app.getHttpServer())
      .delete(`/tasks/${createdBody.id}`)
      .expect(204);

    expect(response.text).toBe('');
  });

  it('GET /tasks/:id returns 404 for a missing id', () => {
    return request(app.getHttpServer()).get('/tasks/missing-id').expect(404);
  });
});

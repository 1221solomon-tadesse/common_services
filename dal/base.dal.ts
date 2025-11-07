import {
  DeepPartial,
  Repository,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryRunner,
  ObjectLiteral,
} from 'typeorm';

/**
 * BaseDAL<T> — A generic base Data Access Layer class
 * 
 * Features:
 * - Reusable CRUD methods (create, find, update, delete)
 * - Supports transactions via QueryRunner
 * - Supports pagination
 * - Works with any TypeORM Entity
 */

export abstract class BaseDAL<T extends ObjectLiteral> {
  protected readonly repo: Repository<T>;

  constructor(repo: Repository<T>) {
    this.repo = repo;
  }

  async create(data: DeepPartial<T>, queryRunner?: QueryRunner): Promise<T> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      const entity = repository.create(data);
      return await repository.save(entity);
    } catch (error) {
      throw new Error(
        `DAL.create failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async createMany(data: DeepPartial<T>[], queryRunner?: QueryRunner): Promise<T[]> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      const entities = repository.create(data);
      return await repository.save(entities);
    } catch (error) {
      throw new Error(
        `DAL.createMany failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async findAll(
    options?: FindManyOptions<T>,
    queryRunner?: QueryRunner,
  ): Promise<T[]> {
    try {
      const defaultWhere = { is_deleted: false } as unknown as FindOptionsWhere<T>;

      const finalOptions: FindManyOptions<T> = {
        ...options,
        where: { ...defaultWhere, ...(options?.where) },
      };

      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      return await repository.find(finalOptions);
    } catch (error) {
      throw new Error(`DAL.findAll failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findOne(
    options: FindOneOptions<T>,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    try {
      const defaultWhere = { is_deleted: false } as unknown as FindOptionsWhere<T>;

      const finalOptions: FindOneOptions<T> = {
        ...options,
        where: { ...defaultWhere, ...(options?.where) },
      };

      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      const entity = await repository.findOne(finalOptions);

      return entity;
    } catch (error) {
      throw new Error(
        `DAL.findOne failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async findById(id: any, queryRunner?: QueryRunner): Promise<T | null> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      return await repository.findOne({
        where: { id } as FindOptionsWhere<T>,
      });
    } catch (error) {
      throw new Error(
        `DAL.findById failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findByEmail(email: string, queryRunner?: QueryRunner): Promise<T | null> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      return await repository.findOne({
        where: { email } as unknown as FindOptionsWhere<T>,
      });
    } catch (error) {
      throw new Error(`DAL.findByEmail failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findPaginated(
    options: FindManyOptions<T>,
    page = 1,
    limit = 10,
    queryRunner?: QueryRunner,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      const [data, total] = await repository.findAndCount({
        ...options,
        skip: (page - 1) * limit,
        take: limit,
      });

      return { data, total, page, limit };
    } catch (error) {
      throw new Error(`DAL.findPaginated failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(id: any, data: DeepPartial<T>, queryRunner?: QueryRunner): Promise<T | null> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      await repository.update(id, data as any);
      return await repository.findOne({ where: { id } as FindOptionsWhere<T> });
    } catch (error) {
      throw new Error(`DAL.update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: any, queryRunner?: QueryRunner): Promise<void> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      await repository.delete(id);
    } catch (error) {
      throw new Error(`DAL.delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async softDelete(
    id: any,
    softField: keyof T = 'deleted_at' as keyof T,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      await repository.update(id, { [softField]: new Date() } as any);
    } catch (error) {
      throw new Error(`DAL.softDelete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async restore(
    id: any,
    softField: keyof T = 'deleted_at' as keyof T,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      await repository.update(id, { [softField]: null } as any);
    } catch (error) {
      throw new Error(`DAL.restore failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async query(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any> {
    try {
      const repository = queryRunner
        ? queryRunner.manager.getRepository(this.repo.target)
        : this.repo;

      return await repository.query(query, parameters);
    } catch (error) {
      throw new Error(`DAL.query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async runInTransaction<R>(
    queryRunner: QueryRunner,
    fn: (qr: QueryRunner) => Promise<R>,
  ): Promise<R> {
    await queryRunner.startTransaction();
    try {
      const result = await fn(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

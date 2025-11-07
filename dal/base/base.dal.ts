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
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    const entity = repository.create(data);
    return await repository.save(entity);
  }

  async createMany(data: DeepPartial<T>[], queryRunner?: QueryRunner): Promise<T[]> {
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    const entities = repository.create(data);
    return await repository.save(entities);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      const defaultWhere = { is_deleted: false } as unknown as FindOptionsWhere<T>;
      const finalOptions = {
        where: { ...defaultWhere, ...(options?.where) },
        ...options,
      };
      return await this.repo.find(finalOptions);
    } catch (error) {
      throw new Error(`DAL.findAll failed: ${error.message}`);
    }
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.repo.findOne(options);
  }

  async findById(id: any): Promise<T | null> {
    return await this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async findByEmail(email: string): Promise<T | null> {
  return await this.repo.findOne({
    where: { email } as unknown as FindOptionsWhere<T>,
  });
}


  async findPaginated(
    options: FindManyOptions<T>,
    page = 1,
    limit = 10,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.repo.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async update(
    id: any,
    data: DeepPartial<T>,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    await repository.update(id, data as any);
    return await repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async delete(id: any, queryRunner?: QueryRunner): Promise<void> {
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    await repository.delete(id);
  }

  async softDelete(
    id: any,
    deleted_by?: string,
    softField: keyof T = 'is_deleted' as keyof T,
    queryRunner?: QueryRunner,
    
  ): Promise<void> {
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    await repository.update(id, { [softField]: true,deleted_by, deleted_at: new Date(),  } as any);
  }

  async restore(
    id: any,
    softField: keyof T = 'is_deleted' as keyof T,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repository = queryRunner ? queryRunner.manager.getRepository(this.repo.target) : this.repo;
    await repository.update(id, { [softField]: false } as any);
  }

  async query(query: string, parameters?: any[]): Promise<any> {
    return await this.repo.query(query, parameters);
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

import type { {{pascal}} } from '{{entityImport}}';
import type { {{pascal}}Repository } from '{{repositoryImport}}';
import type { PrismaClient } from '{{generatedImport}}';
import { PrismaDatabase } from '{{clientImport}}';
import { Prisma{{pascal}}Mapper } from '{{mapperImport}}';

export class Prisma{{pascal}}Repository implements {{pascal}}Repository {
  constructor(private readonly db: PrismaClient = PrismaDatabase.getInstance()) {}

  async findById(id: string): Promise<{{pascal}} | null> {
    const row = await this.db.{{camel}}.findUnique({ where: { id } });
    return row ? Prisma{{pascal}}Mapper.toDomain(row) : null;
  }

  async findAll(): Promise<{{pascal}}[]> {
    const rows = await this.db.{{camel}}.findMany();
    return rows.map((row) => Prisma{{pascal}}Mapper.toDomain(row));
  }

  async save({{camel}}: {{pascal}}): Promise<void> {
    const data = Prisma{{pascal}}Mapper.toPersistence({{camel}});
    await this.db.{{camel}}.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async delete(id: string): Promise<void> {
    await this.db.{{camel}}.deleteMany({ where: { id } });
  }
}

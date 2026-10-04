import { eq } from 'drizzle-orm';
import type { {{pascal}} } from '{{entityImport}}';
import type { {{pascal}}Repository } from '{{repositoryImport}}';
import { DrizzleDatabase, type Database } from '{{clientImport}}';
import { {{pluralCamel}} } from '{{schemaImport}}';
import { Drizzle{{pascal}}Mapper } from '{{mapperImport}}';

export class Drizzle{{pascal}}Repository implements {{pascal}}Repository {
  constructor(private readonly db: Database = DrizzleDatabase.getInstance()) {}

  async findById(id: string): Promise<{{pascal}} | null> {
    const [row] = await this.db.select().from({{pluralCamel}}).where(eq({{pluralCamel}}.id, id)).limit(1);
    return row ? Drizzle{{pascal}}Mapper.toDomain(row) : null;
  }

  async findAll(): Promise<{{pascal}}[]> {
    const rows = await this.db.select().from({{pluralCamel}});
    return rows.map((row) => Drizzle{{pascal}}Mapper.toDomain(row));
  }

  async save({{camel}}: {{pascal}}): Promise<void> {
    const data = Drizzle{{pascal}}Mapper.toPersistence({{camel}});
    await this.db.insert({{pluralCamel}}).values(data).onConflictDoUpdate({ target: {{pluralCamel}}.id, set: data });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete({{pluralCamel}}).where(eq({{pluralCamel}}.id, id));
  }
}

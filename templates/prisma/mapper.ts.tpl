import { {{pascal}} } from '{{entityImport}}';
import type { {{pascal}} as {{pascal}}Row } from '{{generatedImport}}';

export class Prisma{{pascal}}Mapper {
  static toDomain(row: {{pascal}}Row): {{pascal}} {
    return {{pascal}}.create({
      id: row.id,
      createdAt: row.createdAt,
    });
  }

  static toPersistence({{camel}}: {{pascal}}): {{pascal}}Row {
    return {
      id: {{camel}}.id,
      createdAt: {{camel}}.createdAt,
    };
  }
}

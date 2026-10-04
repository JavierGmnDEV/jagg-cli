import { {{pascal}} } from '{{entityImport}}';
import type { {{pluralCamel}} } from '{{schemaImport}}';

type {{pascal}}Row = typeof {{pluralCamel}}.$inferSelect;
type New{{pascal}}Row = typeof {{pluralCamel}}.$inferInsert;

export class Drizzle{{pascal}}Mapper {
  static toDomain(row: {{pascal}}Row): {{pascal}} {
    return {{pascal}}.create({
      id: row.id,
      createdAt: row.createdAt,
    });
  }

  static toPersistence({{camel}}: {{pascal}}): New{{pascal}}Row {
    return {
      id: {{camel}}.id,
      createdAt: {{camel}}.createdAt,
    };
  }
}

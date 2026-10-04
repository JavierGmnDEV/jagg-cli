import type { {{pascal}} } from '{{entityImport}}';
import type { {{pascal}}Repository } from '{{repositoryImport}}';

export class InMemory{{pascal}}Repository implements {{pascal}}Repository {
  private readonly items = new Map<string, {{pascal}}>();

  async findById(id: string): Promise<{{pascal}} | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(): Promise<{{pascal}}[]> {
    return [...this.items.values()];
  }

  async save({{camel}}: {{pascal}}): Promise<void> {
    this.items.set({{camel}}.id, {{camel}});
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

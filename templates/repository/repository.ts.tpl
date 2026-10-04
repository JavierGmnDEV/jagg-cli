import type { {{pascal}} } from '{{entityImport}}';

export interface {{pascal}}Repository {
  findById(id: string): Promise<{{pascal}} | null>;
  findAll(): Promise<{{pascal}}[]>;
  save({{camel}}: {{pascal}}): Promise<void>;
  delete(id: string): Promise<void>;
}

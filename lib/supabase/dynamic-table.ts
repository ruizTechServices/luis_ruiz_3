import "server-only";

export interface DynamicQueryResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
}

export interface DynamicSelectQuery<T = unknown[]> extends PromiseLike<DynamicQueryResult<T>> {
  eq(column: string, value: unknown): DynamicSelectQuery<T>;
  limit(count: number): DynamicSelectQuery<T>;
  order(column: string, options?: { ascending?: boolean }): DynamicSelectQuery<T>;
}

export interface DynamicMutationQuery extends PromiseLike<DynamicQueryResult> {
  eq(column: string, value: unknown): DynamicMutationQuery;
}

export interface DynamicTable {
  select(columns: string, options?: { count?: "exact"; head?: boolean }): DynamicSelectQuery;
  insert(values: unknown): PromiseLike<DynamicQueryResult>;
  update(values: unknown): DynamicMutationQuery;
  delete(): DynamicMutationQuery;
}

export function dynamicTable(client: { from(table: string): unknown }, table: string): DynamicTable {
  return client.from(table) as DynamicTable;
}

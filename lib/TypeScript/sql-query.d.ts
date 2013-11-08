declare module "sqlquery" {
    module sqlquery {
        export class Query {
            constructor(dialect: string);
            constructor(options: {
                dialect: string;
            });
            static Text(type: string): TextQuery;

            static Comparators: string[];
            static between(a: number, b: number): Comparator;
            static not_between(a: number, b: number): Comparator;
            static like(expression: string): Comparator;
            static eq(value: any): Comparator;
            static ne(value: any): Comparator;
            static gt(value: any): Comparator;
            static gte(value: any): Comparator;
            static lt(value: any): Comparator;
            static lte(value: any): Comparator;

            escapeId(id: string): string;
            escapeId(id: string, table: string): string;
            escapeVal(value: any): string;
            select(): SelectQuery;
            insert(): InsertQuery;
            update(): UpdateQuery;
            remove(): RemoveQuery;
        }

        export interface Comparator {
            sql_comparator(): string;
            from?: any;
            to?: any;
            expr?: string;
            value?: any;
        }

        export interface TextQuery {
            data: any;
            type: string;
        }

        export interface SelectQuery {
            select(fields: string): SelectQuery;
            calculateFoundRows: SelectQuery;
            as(alias: string): SelectQuery;
            fun(fun: string, column: string, alias: string): SelectQuery;
            from(table: string, from_id: string, to_id: string): SelectQuery;
            from(table: string, from_id: string, to_table: string, to_id: string): SelectQuery;
            where(...args: any[]): SelectQuery;
            whereExists(table: string, table_link: string, link: string, conditions: { [column: string]: any }): SelectQuery;
            groupBy(...columns: string[]): SelectQuery;
            offset(offset: number): SelectQuery;
            limit(limit: number): SelectQuery;
            order(column: string, direction: string): SelectQuery;
            build(): string;
        }

        export interface InsertQuery {
            into(table: string): InsertQuery;
            set(values: { [key: string]: any }[]): InsertQuery;
            build(): string;
        }

        export interface UpdateQuery {
            into(table: string): UpdateQuery;
            set(values: { [column: string]: any }): UpdateQuery;
            where(...conditions: { [column: string]: any }[]): UpdateQuery;
            build(): string;
        }

        export interface RemoveQuery {
            from(table: string): RemoveQuery;
            where(...conditions: { [column: string]: any }[]): RemoveQuery;
            build(): string;
        }
    }
    export = sqlquery;
}

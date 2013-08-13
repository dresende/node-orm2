declare module sqlquery {
    export interface QueryStatic {
        Query(dialect: string): Query;
        Query(options: {
            dialect: string;
        }): Query;
        Text(type: string): TextQuery;

        Comparators: string[];
        between(a: number, b: number): Comparator;
        not_between(a: number, b: number): Comparator;
        like(expression: string): Comparator;
        eq(value: any): Comparator;
        ne(value: any): Comparator;
        gt(value: any): Comparator;
        gte(value: any): Comparator;
        lt(value: any): Comparator;
        lte(value: any): Comparator;
    }

    export interface Query {
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

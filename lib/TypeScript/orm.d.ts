/// <reference path="sql-query.d.ts" />

declare module "orm" {

    import events = require('events');
    import sqlquery = require('sqlquery');

    module orm {

        /**
        * Parameter Type Interfaces
        **/

        export interface Model {
            (): Instance;
            (...ids: any[]): Instance;

            properties: { [property: string]: Property };
            settings: Settings;

            drop(callback?: (err: Error) => void): Model;
            sync(callback?: (err: Error) => void): Model;
            get(...args: any[]): Model;
            find(conditions: { [property: string]: any }, callback: (err: Error, results: Instance[]) => void): Model;
            find(conditions: { [property: string]: any }, options: {
                limit?: number;
                order?: any;
            }, callback: (err: Error, results: Instance[]) => void): Model;
            find(conditions: { [property: string]: any }, limit: number, order: string[], callback: (err: Error, results: Instance[]) => void): Model;
            find(conditions: { [property: string]: any }): IChainFind;

            all(conditions: { [property: string]: any }, callback: (err: Error, results: Instance[]) => void): Model;
            all(conditions: { [property: string]: any }, options: {
                limit?: number;
                order?: any;
            }, callback: (err: Error, results: Instance[]) => void): Model;
            all(conditions: { [property: string]: any }, limit: number, order: string[], callback: (err: Error, results: Instance[]) => void): Model;

            one(conditions: { [property: string]: any }, callback: (err: Error, result: Instance) => void): Model;
            one(conditions: { [property: string]: any }, options: {
                limit?: number;
                order?: any;
            }, callback: (err: Error, result: Instance) => void): Model;
            one(conditions: { [property: string]: any }, limit: number, order: string[], callback: (err: Error, result: Instance) => void): Model;

            count(callback: (err: Error, count: number) => void): Model;
            count(conditions: { [property: string]: any }, callback: (err: Error, count: number) => void): Model;

            aggregate(conditions: { [property: string]: any }): IAggregated;
            aggregate(properties: string[]): IAggregated;
            aggregate(conditions: { [property: string]: any }, properties: string[]): IAggregated;

            exists(id: any, callback: (err: Error, exists: boolean) => void): Model;
            exists(...args: any[]): Model;

            create(data: { [property: string]: any; }, callback: (err: Error, instance: Instance) => void): Model;
            create(...args: any[]): Model;

            clear(): Model;

            table: string;
            id: string[];

            [property: string]: any;
        }

        export interface Instance {
            on(event: string, callback): Instance;
            save(): Instance;
            save(data: { [property: string]: any; }, callback: (err: Error) => void): Instance;
            save(data: { [property: string]: any; }, options: any, callback: (err: Error) => void): Instance;
            saved: boolean;
            remove(callback: (err: Error) => void): Instance;
            isInstance: boolean;
            isPersisted: boolean;
            isShell: boolean;
            validate(callback: (errors: Error[]) => void);
            model: Model;

            [property: string]: any;
        }

        export interface ModelOptions {
            id?: string[];
            autoFetch?: boolean;
            autoFetchLimit?: number;
            cacheFetch?: boolean;
            hooks?: { [property: string]: Hooks };
            methods?: { [name: string]: Function };
        }

        export interface Hooks {
            beforeValidation?: (next?) => void;
            beforeCreate?: (next?) => void;
            afterCreate?: (next?) => void;
            beforeSave?: (next?) => void;
            afterSave?: (next?) => void;
            afterLoad?: (next?) => void;
            afterAutoFetch?: (next?) => void;
            beforeRemove?: (next?) => void;
            afterRemove?: (next?) => void;
        }

        export interface IConnectionOptions {
            protocol: string;
            host?: string;
            port?: number;
            auth?: string;
            username?: string;
            password?: string;
            database?: string;
            pool?: boolean;
            debug?: boolean;
        }

        export interface IAggregated {
            groupBy(...columns: string[]): IAggregated;
            limit(limit: number): IAggregated;
            limit(offset: number, limit: number): IAggregated;
            order(...order: string[]): IAggregated;
            select(columns: string[]): IAggregated;
            select(...columns: string[]): IAggregated;
            as(alias: string): IAggregated;
            call(fun: string, args: any[]): IAggregated;
            get(callback: (err: Error, instance: Instance) => void);
        }

        export interface IChainFind {
            find(conditions: { [property: string]: any }): IChainFind;
            only(...args: string[]): IChainFind;
            limit(limit: number): IChainFind;
            offset(offset: number): IChainFind;
            run(callback: (err: Error, results: Instance[]) => void): void;
            count(callback: (err: Error, count: number) => void): void;
            remove(callback: (err: Error) => void): void;
            save(callback: (err: Error) => void): void;
            each(callback: (result: Instance) => void): void;
            each(): IChainFind;
            filter(callback: (result: Instance) => boolean): IChainFind;
            sort(callback: (a: Instance, b: Instance) => boolean): IChainFind;
            get(callback: (results: Instance[]) => void): IChainFind;
        }

        /*
         * Classes
        */

        export class ORM extends events.EventEmitter {
            validators: enforce;
            enforce: enforce;
            settings: Settings;
            driver_name: string;
            driver: any;
            tools: any;
            models: { [key: string]: Model };
            plugins: Plugin[];

            use(plugin: string, options?: any): ORM;
            use(plugin: Plugin, options?: any): ORM;

            define(name: string, properties: { [key: string]: Property }, opts?: ModelOptions): Model;
            ping(callback: (err: Error) => void): ORM;
            close(callback: (err: Error) => void): ORM;
            load(file: string, callback: (err: Error) => void): any;
            sync(callback: (err: Error) => void): ORM;
            drop(callback: (err: Error) => void): ORM;
        }

        export class enforce {
            static required(message?: string);
            static notEmptyString(message?: string);
            static rangeNumber(min: number, max: number, message?: string);
            static rangeLength(min: number, max: number, message?: string);
            static insideList(inside: string[], message?: string);
            static insideList(inside: number[], message?: string);
            static outsideList(outside: string[], message?: string);
            static outsideList(outside: number[], message?: string);
            static password(conditions?: string, message?: string);
            static patterns(expr: RegExp, message?: string);
            static patterns(expr: string, flags: string, message?: string);
            static equalToProperty(name: string, message?: string);
            static unique(message?: string);
            static unique(opts: { ignoreCase: boolean }, message?: string);
        }

        export function equalToProperty(name: string, message?: string);
        export function unique(message?: string);
        export function unique(opts: { ignoreCase: boolean }, message?: string);

        export class singleton {
            static clear(key?: string): singleton;
            static get(key, opts: {
                cache?: any;
                save_check?: boolean;
            }, createCb: Function, returnCb: Function);
        }

        export class Settings {
            static Container: any;

            static defaults(): {
                properties: {
                    primary_key: string;
                    association_key: string;
                    required: boolean;
                };

                instance: {
                    cache: boolean;
                    cacheSaveCheck: boolean;
                    autoSave: boolean;
                    autoFetch: boolean;
                    autoFetchLimit: number;
                    cascadeRemove: boolean;
                    returnAllErrors: boolean;
                };

                connection: {
                    reconnect: boolean;
                    poll: boolean;
                    debug: boolean;
                };
            };

            constructor(settings: any);

            //[key: string]: {
            //    get: (key, def) => any;
            //    set: (key, value) => Settings;
            //    unset: (...keys: string[]) => Settings;
            //}

        }

        export var settings: Settings;

        export class Property {
            static normalize(property: string, settings: Settings): any;
            static validate(value: any, property: string): any;
        }

        export interface ErrorCodes {
            QUERY_ERROR: number;
            NOT_FOUND: number;
            NOT_DEFINED: number;
            NO_SUPPORT: number;
            MISSING_CALLBACK: number;
            PARAM_MISMATCH: number;
            CONNECTION_LOST: number;

            generateError(code: number, message: string, extra: any): Error;
        }

        export function Text(type: string): sqlquery.TextQuery;
        export function eq(value: any): sqlquery.Comparator;
        export function ne(value: any): sqlquery.Comparator;
        export function gt(value: any): sqlquery.Comparator;
        export function gte(value: any): sqlquery.Comparator;
        export function lt(value: any): sqlquery.Comparator;
        export function lte(value: any): sqlquery.Comparator;
        export function like(value: string): sqlquery.Comparator;
        export function between(a: number, b: number): sqlquery.Comparator;
        export function not_between(a: number, b: number): sqlquery.Comparator;
        export function express(uri: string, handlers: {
            define(db: ORM, models: { [key: string]: Model });
        }): (req, res, next) => void;
        export function use(connection, protocol: string, options, callback: (err: Error, db?: ORM) => void);
        export function connect(uri: string): ORM;
        export function connect(uri: string, callback: (err: Error, db: ORM) => void);
        export function connect(options: IConnectionOptions): ORM;
        export function connect(options: IConnectionOptions, callback: (err: Error, db: ORM) => void);
    }

    export = orm;
}
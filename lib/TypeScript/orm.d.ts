/// <reference path="enforce.d.ts"/>
/// <reference path="sql-query.d.ts"/>

declare module orm {
    export interface ORMStatic {
        validators: ValidatorsStatic;
        enforce: enforce.EnforceStatic;
        singleton: SingletonStatic;
        settings: Settings;

        Property: PropertyStatic;
        Settings: SettingsStatic;
        ErrorCodes: ErrorCodesStatic;
        Text: sqlquery.TextQuery;

        express(uri: string, options: {
            define: (db: ORM, models: Model[]) => void;
            error: (err: Error) => void;
        }): Express;

        express(database: ConnectionOptions, options: {
            define: (db: ORM, models: Model[]) => void;
            error: (err: Error) => void;
        }): Express;

        use(connection: Connection, proto: string, opts: ConnectionOptions, cb: (err: Error, orm: ORM) => void): void;
        connect(opts: ConnectionOptions, cb: (err: Error, orm: ORM) => void): Error;
    }

    export interface ORM {
        use(plugin: string, options?: any): ORM;
        use(plugin: ORMPlugin, options?: any): ORM;
        define(name: string, properties: ModelProperties, options: ModelOptions): Model;
        ping(cb: (err: Error) => void);
        close(cb: (err: Error) => void);
        load(file: string, cb: (err: Error) => void): any;
        sync(cb: (err?: Error) => void): ORM;
        drop(cb: (err?: Error) => void): ORM;

        //serial(args...: any[]): ORM;
    }

    export interface ValidatorsStatic {
        required(message?: string): enforce.Validator;
        notEmptyString(message?: string): enforce.Validator;
        rangeNumber(min: number, max: number, message?: string): enforce.Validator;
        rangeLength(min: number, max: number, message?: string): enforce.Validator;
        insideList(list: string[], message?: string): enforce.Validator;
        insideList(list: number[], message?: string): enforce.Validator;
        outsideList(list: string[], message?: string): enforce.Validator;
        outsideList(list: number[], message?: string): enforce.Validator;
        password(checks: string, message?: string): enforce.Validator;
        patterns: {
            match(pattern: RegExp, message?: string): enforce.Validator;
            match(pattern: string, modifiers: string, message?: string): enforce.Validator;
            hexString(message?: string): enforce.Validator;
            email(message?: string): enforce.Validator;
            ipv4(message?: string): enforce.Validator;
        }
        equalToProperty(name: string, message?: string): enforce.Validator;
        unique(): enforce.Validator;
    }

    export interface SingletonStatic {
        clear(key?: string): SingletonStatic;
        get(key: string, opts: { cache?: any; save_check?: boolean; },
            createCallback: (object: any) => void,
            returnCallback: (object: any) => void);
    }

    export interface SettingsStatic {
        defaults: () => SettingsStore;

        Container(settings: SettingsStore): Settings;
    }

    export interface Settings {
        set(key: string, value: any): Settings;
        get(key: string, def: any): any;
        unset(...keys: string[]): Settings;
    }

    export interface SettingsStore {
        properties: {
            primary_key: string;
            association_key: string;
            required: string;
        }

        instance: {
            cache: boolean;
            cacheSaveCheck: boolean;
            autoSave: boolean;
            autoFetch: boolean;
            autoFetchLimit: number;
            cascadeRemove: boolean;
            returnAllErrors: boolean;
        }

        connection: {
            reconnect: boolean;
            poll: boolean;
            debug: boolean;
        }
    }

    export interface PropertyStatic {
        normalize(property: Function, settings: Settings): ModelProperty;
        normalize(property: string, settings: Settings): ModelProperty;
        normalize(property: any[], settings: Settings): ModelProperty;
        validate(value: any, property: ModelProperty): any;
    }

    export interface ErrorCodesStatic {
        QUERY_ERROR: number;
        NOT_FOUND: number;
        NOT_DEFINED: number;
        NO_SUPPORT: number;
        MISSING_CALLBACK: number;
        PARAM_MISSMATCH: number;
        CONNECTION_LOST: number;

        generateError(code: number, message: string, extra: { [property: string]: any }): Error;
    }

    export interface Express {
        
    }

    export interface Connection {

    }

    export interface ConnectionOptions {
    
    }

    export interface ORMPlugin {
        define(model: Model, db: ORM);
        beforeDefine(name: string, properties: ModelProperties, options: ModelOptions);
    }

    export interface Model {
        table: string;
        id: string;
        properties: ModelProperties;
        uid: string;

        get(id: any, options: FindOptions, cb: (err: Error, result: Instance) => void): Model;
        get(id: any, cb: (err: Error, result: Instance) => void): Model;

        find(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string, cb?: (err: Error, results: Instance[]) => void): ChainFind;
        find(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string[], cb?: (err: Error, results: Instance[]) => void): ChainFind;

        all(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string, cb?: (err: Error, results: Instance[]) => void): ChainFind;
        all(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string[], cb?: (err: Error, results: Instance[]) => void): ChainFind;

        count(conditions: { [property: string]: any }, cb: (err: Error, count: number) => void): ChainFind;
        count(cb: (err: Error, count: number) => void): ChainFind;

        exists(conditions: { [property: string]: any }, cb: (err: Error, exists: boolean) => void): ChainFind;
        exists(cb: (err: Error, exists: boolean) => void): ChainFind;

        one(conditions: { [property: string]: any }, cb: (err: Error, result: Instance) => void): ChainFind;
        one(cb: (err: Error, result: Instance) => void): ChainFind;

        aggregate(fields: string[], conditions?: { [property: string]: any }): ChainAggregate;
        aggregate(conditions?: { [property: string]: any }): ChainAggregate;


        create(values: InstanceProperties, cb: (err: Error, newInstance: Instance) => void): Model;
        create(values: InstanceProperties[], cb: (err: Error, newInstance: Instance) => void): Model;

        clear(cb: (err: Error) => void): Model;

        hasOne(name: string, model: Model, options: {
            autoFetch?: boolean;
            autoFetchLimit?: number;
            field?: string;
            reverse?: string;
            accessor?: string;
            reverseAccessor?: string;
            required?: boolean;
            getAccessor?: string;
            setAccessor?: string;
            hasAccessor?: string;
            delAccessor?: string;
        }): Association;

        extendsTo(name: string, properties: ModelProperties, options: {
            autoFetch?: boolean;
            autoFetchLimit?: number;
            field?: string;
            table?: string;
            required?: boolean;
            getAccessor?: string;
            setAccessor?: string;
            hasAccessor?: string;
            delAccessor?: string;
            cache?: boolean;
            autoSave?: boolean;
            cascadeRemove?: boolean;
            hooks?: { [hook: string]: (cb?: () => void) => void; };
            methods?: { [name: string]: Function; };
            validations?: { [property: string]: enforce.Validator[];[property: string]: enforce.Validator; };
        }): Model;

        hasMany(name: string, model: Model, properties: ModelProperties, options: {
            autoFetch?: boolean;
            autoFetchLimit?: number;
            accessor?: string;
            reverse?: string;
            field?: string[];
            mergeTable?: string;
            mergeId?: string[];
            mergeAssocId?: string[];
            getAccessor?: string;
            setAccessor?: string;
            hasAccessor?: string;
            delAccessor?: string;
            addAccessor?: string;
        }): Association;
    }

    export interface ModelProperties {
        [name: string]: Object;
        [name: string]: ModelProperty[];
    }

    export interface ModelProperty {
        type: string;
        required?: boolean;
        defaultValue?: string;
        size?: number;
        big?: boolean;
        unique?: boolean;
        time?: boolean;
        rational?: boolean;
        unsigned?: boolean;
    }

    export interface ModelOptions {
        id?: string[];
        cache?: boolean;
        autoSave?: boolean;
        autoFetch?: boolean;
        autoFetchLimit?: number;

        methods?: {
            [name: string]: Function;
        };
        hooks?: {
            [name: string]: (cb?: () => void) => void;
        };
    }

    export interface FindOptions {
        cache?: boolean;
        autoSave?: boolean;
        autoFetch?: boolean;
        autoFetchLimit?: number;
    }

    export interface Instance {
        [property: string]: any;

        save(cb: (err: Error) => void): Instance;
        save(data: InstanceProperties, cb: (err: Error) => void): Instance;
        save(data: InstanceProperties, saveOptions: FindOptions, cb: (err: Error) => void): Instance;

        saved: boolean;
        isInstance: boolean;
        isShell: boolean;
        model: Model;

        validate(cb: (err: Error, errors: Error[]) => void);

        remove(cb: (err: Error) => void): Instance;
    }
    
    interface InstanceProperties {
        [property: string]: any
    }

    export interface ChainFind {
        get(id: any, options: FindOptions, cb: (err: Error, result: Instance) => void): Model;
        get(id: any, cb: (err: Error, result: Instance) => void): Model;

        find(sql: string): ChainFind;
        find(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string, cb?: (err: Error, results: Instance[]) => void): ChainFind;
        find(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string[], cb?: (err: Error, results: Instance[]) => void): ChainFind;

        only(...fields: string[]): ChainFind;
        only(fields: string[]): ChainFind;

        all(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string, cb?: (err: Error, results: Instance[]) => void): ChainFind;
        all(conditions?: { [property: string]: any }, options?: FindOptions, limit?: number, order?: string[], cb?: (err: Error, results: Instance[]) => void): ChainFind;

        count(conditions: { [property: string]: any }, cb: (err: Error, count: number) => void): ChainFind;
        count(cb: (err: Error, count: number) => void): ChainFind;

        exists(conditions: { [property: string]: any }, cb: (err: Error, exists: boolean) => void): ChainFind;
        exists(cb: (err: Error, exists: boolean) => void): ChainFind;

        one(conditions: { [property: string]: any }, cb: (err: Error, result: Instance) => void): ChainFind;
        one(cb: (err: Error, result: Instance) => void): ChainFind;

        aggregate(fields: string[], conditions?: { [property: string]: any }): ChainAggregate;
        aggregate(conditions?: { [property: string]: any }): ChainAggregate;

        limit(limit: number): ChainFind;
        skip(offset: number): ChainFind;
        offset(offset: number): ChainFind;
        order(property: string, order: string): ChainFind;
        order(property: string[], order: string): ChainFind;
        remove(cb: (err: Error) => void): ChainFind;
        first(cb: (err: Error, result: Instance) => void): ChainFind;
        last(cb: (err: Error, result: Instance) => void): ChainFind;
        run(cb: (err: Error, results: Instance[]) => void): ChainFind;

        each(cb: (err: Error, result: Instance) => void): ChainInstance;
    }

    export interface ChainAggregate {
        limit(limit: number): Model;
        limit(offset: number, limit: number): Model;

        min(field: string): Model;
        max(field: string): Model;
        avg(field: string): Model;
        sum(field: string): Model;
        count(field: string): Model;
    }

    export interface ChainInstance {
        filter(cb: (instance: Instance) => boolean): () => ChainInstance;
        forEach(cb: (instance: Instance) => void): () => ChainInstance;
        sort(cb: (instance: Instance) => any): () => ChainInstance;
        count(cb: (count: number) => any): () => ChainInstance;
        get(cb: (instances: Instance[]) => any): () => ChainInstance;
        save(cb: (instance: Instance) => any): () => ChainInstance;
    }

    export interface Association {
        prepare(model: Model, associations: Association[], association_properties: string[], model_fields: string[]);
        extend(model: Model, instance: Instance, driver: Driver, associations: Association[], options: {});
        autoFetch(instance: Instance, associations: Association[], options: {}, cb: () => void);
    }

    export interface Driver {

    }
}

declare module enforce {
    export interface EnforceStatic {
        equalToProperty(name: string, message?: string): enforce.Validator;
        unique(): enforce.Validator;
    }
}
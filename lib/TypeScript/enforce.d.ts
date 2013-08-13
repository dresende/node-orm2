declare module enforce {
    export interface EnforceStatic {
        Enforce(opts: Options): Enforce;

        required(message?: string): Validator;
        notEmptyString(message?: string): Validator;

        ranges: {
            number(min: number, max: number, message?: string): Validator;
            length(min: number, max: number, message?: string): Validator;
        }

        lists: {
            inside(list: string[], message?: string): Validator;
            inside(list: number[], message?: string): Validator;
            outside(list: string[], message?: string): Validator;
            outside(list: number[], message?: string): Validator;
        }

        security: {
            password(checks: string, message?: string): Validator;
        }

        patterns: {
            match(pattern: RegExp, message?: string): Validator;
            match(pattern: string, modifiers: string, message?: string): Validator;
            hexString(message?: string): Validator;
            email(message?: string): Validator;
            ipv4(message?: string): Validator;
        }
    }

    export interface Enforce {        
        add(property: string, validator: Validator): Enforce;
        context(): any;
        context(name: string): any;
        context(name: string, value: any): Enforce;
        clear();
        check(data: any, cb: (errors: Error[]) => void);
    }

    export interface Options {
        returnAllErrors: boolean;
    }

    export interface Validator {
        (value: any, next: (message?: string) => boolean): boolean;
    }
}
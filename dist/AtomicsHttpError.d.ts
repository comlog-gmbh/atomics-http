declare const _default: {
    new (message?: string): {
        code: any;
        name: string;
        message: string;
        stack?: string;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
    stackTraceLimit: number;
};
export = _default;

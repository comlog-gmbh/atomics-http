export interface AgentAdapter {
    options: Object;
    construct: string | Function;
}
export declare function toAgentAdapter(agent: any): any;
export declare function adapterToAgent(adapter?: boolean | AgentAdapter): any;

declare module "autocannon" {
  import { EventEmitter } from "events";
  export type Results = {
    requests: number;
    latencyMean: number;
    statusCodes: Record<number, number>;
  };

  type Callback = (err: Error | null, res: Results) => void;

  export default function autocannon(
    options: Record<string, unknown>,
    callback: Callback
  ): EventEmitter;
}


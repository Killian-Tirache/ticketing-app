import { model, Schema } from "mongoose";

interface ICounter {
  _id: string;
  sequence: number;
  year: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
  year: { type: Number, required: true },
});

export const Counter = model<ICounter>("Counter", counterSchema);

import { Types } from "mongoose";

export interface IMessage {
  _id: string;
  ticket: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
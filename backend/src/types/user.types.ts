import { Types } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "support" | "admin";
  password: string;
  companies?: Types.ObjectId[];
  isDeleted?: boolean;
}

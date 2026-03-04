import { Schema, Query } from "mongoose";

export function softDeleteFilter(schema: Schema) {
  if (!schema.path("isDeleted")) {
    schema.add({
      isDeleted: { type: Boolean, default: false },
    });
  }

  function excludeDeleted(this: Query<any, any>) {
    const filter = this.getFilter();

    if (!("isDeleted" in filter)) {
      this.where({ isDeleted: { $ne: true } });
    }
  }

  schema.pre<Query<any, any>>("find", excludeDeleted);
  schema.pre<Query<any, any>>("findOne", excludeDeleted);
  schema.pre<Query<any, any>>("findOneAndUpdate", excludeDeleted);
  schema.pre<Query<any, any>>("countDocuments", excludeDeleted);
}

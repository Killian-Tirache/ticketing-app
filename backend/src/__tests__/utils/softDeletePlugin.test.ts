import mongoose from "mongoose";
import "../setup";
import { softDeleteFilter } from "../../utils/softDeleteFilter";

interface ITestDoc {
  name: string;
  isDeleted?: boolean;
}

describe("Soft Delete Plugin", () => {
  let TestModel: mongoose.Model<ITestDoc>;

  beforeAll(() => {
    const testSchema = new mongoose.Schema<ITestDoc>({
      name: String,
    });

    testSchema.plugin(softDeleteFilter);

    TestModel = mongoose.model<ITestDoc>("TestDoc", testSchema);
  });

  it("should add isDeleted field", () => {
    const paths = TestModel.schema.paths;
    expect(paths.isDeleted).toBeDefined();
  });

  it("should exclude deleted documents in find", async () => {
    await TestModel.create({ name: "active" });
    await TestModel.create({ name: "deleted", isDeleted: true });

    const results = await TestModel.find();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe("active");
  });

  it("should exclude deleted documents in findOne", async () => {
    const deleted = await TestModel.create({
      name: "deleted",
      isDeleted: true,
    });

    const result = await TestModel.findOne({ name: "deleted" });

    expect(result).toBeNull();
  });

  it("should allow finding deleted with explicit filter", async () => {
    await TestModel.create({ name: "deleted", isDeleted: true });

    const result = await TestModel.findOne({ isDeleted: true });

    expect(result).not.toBeNull();
    expect(result?.name).toBe("deleted");
  });
});

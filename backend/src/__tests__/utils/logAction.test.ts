import { logAction } from "../../utils/logAction";
import { Log } from "../../models/log.model";
import { Types } from "mongoose";
import "../setup";

describe("logAction", () => {
  afterEach(async () => {
    await Log.deleteMany({});
  });

  it("should create a log entry", async () => {
    const userId = new Types.ObjectId();
    const entityId = new Types.ObjectId();

    await logAction({
      userId,
      action: "create",
      entity: "Ticket",
      entityId,
      success: true,
      message: "Ticket created",
      details: { ticketNumber: 1 },
    });

    const logs = await Log.find({ userId });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("create");
    expect(logs[0].entity).toBe("Ticket");
    expect(logs[0].success).toBe(true);
    expect(logs[0].message).toBe("Ticket created");
  });

  it("should handle invalid userId gracefully", async () => {
    const result = await logAction({
      userId: "invalid" as any,
      action: "create",
      entity: "Test",
      entityId: new Types.ObjectId(),
      success: false,
    });

    expect(result).toBeUndefined();
    const logs = await Log.find({});
    expect(logs).toHaveLength(0);
  });

  it("should log error actions", async () => {
    const userId = new Types.ObjectId();
    const entityId = new Types.ObjectId();

    await logAction({
      userId,
      action: "error",
      entity: "System",
      entityId,
      success: false,
      message: "Something went wrong",
      details: { error: "Test error" },
    });

    const logs = await Log.find({ userId });
    expect(logs).toHaveLength(1);
    expect(logs[0].success).toBe(false);
    expect(logs[0].action).toBe("error");
  });
});

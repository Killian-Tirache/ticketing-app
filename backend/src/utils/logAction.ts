import mongoose from "mongoose";
import { Log } from "../models/log.model";
import { ILog } from "../types/log.types";
import { createLogValidation } from "../validations/logValidation";

export const logAction = async (logData: ILog) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(logData.userId)) {
      console.error("UserId invalide pour le log");
      return;
    }
    const validationData = {
      ...logData,
      userId: logData.userId.toString(),
      entityId: logData.entityId ? logData.entityId.toString() : undefined,
    };
    const { error } = createLogValidation.validate(validationData);
    if (error) {
      console.error("Validation du log échouée :", error.details[0].message);
      return;
    }

    await Log.create(logData);
  } catch (error) {
    console.error("Échec de l'enregistrement du log :", error);
  }
};

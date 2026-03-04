import dotenv from "dotenv";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { User } from "../models/user.model";
import { Company } from "../models/company.model";
import { Ticket } from "../models/ticket.model";
import { Log } from "../models/log.model";
import { IUser } from "../types/user.types";
import { ITicket } from "../types/ticket.types";
import path from "path";
import { getNextTicketNumberForCompany } from "../utils/getNextTicketNumber";
import { Counter } from "../models/counter.model";

dotenv.config({ path: path.resolve(__dirname, "../../../env/.env.backend") });

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI n'est pas défini dans le fichier .env");
  process.exit(1);
}

// Configuration
const COMPANIES_COUNT = 100;
const USERS_COUNT = 100;
const TICKETS_COUNT = 100;

const seed = async () => {
  try {
    console.log("🚀 Début du seeding...\n");

    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connecté\n");

    console.log("🗑️  Nettoyage des collections...");
    await User.deleteMany({});
    await Company.deleteMany({});
    await Ticket.deleteMany({});
    await Log.deleteMany({});
    await Counter.deleteMany({});
    console.log("✅ Collections nettoyées\n");

    // ==================== 1. COMPANIES ====================
    console.log(`📦 Création de ${COMPANIES_COUNT} companies...`);
    const companies = [];

    for (let i = 0; i < COMPANIES_COUNT; i++) {
      const company = await Company.create({
        name: `${faker.company.name()} #${String(i + 1).padStart(3, "0")}`, // Ex: "Welch and Sons #001"
        ticketPrefix: `${faker.company.name().substring(0, 3)}-${String(i + 1).padStart(3, "0")}`,
        isDeleted: faker.datatype.boolean(0.05),
      });
      companies.push(company);
    }

    console.log(`✅ ${companies.length} companies créées\n`);

    // ==================== 2. USERS ====================
    console.log(`👥 Création de ${USERS_COUNT} users...`);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("Password@123", salt);

    const users: (mongoose.Document<unknown, {}, IUser> &
      IUser & { _id: Types.ObjectId })[] = [];

    // 1 Super Admin
    const superAdmin = await User.create({
      firstName: "Admin",
      lastName: "System",
      email: "admin@ticketing.com",
      password: passwordHash,
      role: "admin",
      companies: [],
      isDeleted: false,
    });
    users.push(superAdmin);
    console.log("  ✅ Admin créé: admin@ticketing.com");

    const roles = ["user", "support", "admin"];
    const roleWeights = [0.6, 0.3, 0.1];

    for (let i = 0; i < USERS_COUNT - 1; i++) {
      const random = Math.random();
      let role = "user";
      if (random < roleWeights[2]) {
        role = "admin";
      } else if (random < roleWeights[1] + roleWeights[2]) {
        role = "support";
      }

      let userCompanies: Types.ObjectId[] = [];
      if (role !== "admin" || faker.datatype.boolean(0.7)) {
        const companyCount = faker.number.int({ min: 1, max: 3 });
        const shuffled = [...companies].sort(() => 0.5 - Math.random());
        userCompanies = shuffled
          .slice(0, companyCount)
          .map((c) => c._id)
          .filter((c) => c !== undefined);
      }

      const user = await User.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: passwordHash,
        role,
        companies: userCompanies,
        isDeleted: faker.datatype.boolean(0.03),
      });
      users.push(user);
    }

    console.log(`✅ ${users.length} users créés`);
    console.log(
      `   - Admins: ${users.filter((u) => u.role === "admin").length}`,
    );
    console.log(
      `   - Support: ${users.filter((u) => u.role === "support").length}`,
    );
    console.log(
      `   - Users: ${users.filter((u) => u.role === "user").length}\n`,
    );

    // ==================== 3. TICKETS ====================
    console.log(`🎫 Création de ${TICKETS_COUNT} tickets...`);

    const statuses = ["open", "in_progress", "resolved", "closed"] as const;
    const priorities = ["low", "medium", "high", "critical"] as const;
    const types = ["bug", "feature", "support", "incident"] as const;

    const tickets: (mongoose.Document<unknown, {}, ITicket> &
      ITicket & { _id: Types.ObjectId })[] = [];

    for (let i = 0; i < TICKETS_COUNT; i++) {
      const activeCompanies = companies.filter((c) => !c.isDeleted);
      const company = faker.helpers.arrayElement(
        activeCompanies.length > 0 ? activeCompanies : companies,
      );

      let eligibleUsers = users.filter(
        (u) =>
          !u.isDeleted &&
          (u.companies?.some(
            (cId) => cId.toString() === company._id.toString(),
          ) ||
            u.role === "admin"),
      );

      if (eligibleUsers.length === 0) {
        eligibleUsers = users.filter((u) => !u.isDeleted);
      }

      const createdBy = faker.helpers.arrayElement(eligibleUsers);

      let assignedTo: Types.ObjectId | undefined = undefined;
      if (faker.datatype.boolean(0.5)) {
        const supportUsers = users.filter(
          (u) =>
            !u.isDeleted &&
            ["support", "admin"].includes(u.role) &&
            (u.companies?.some(
              (cId) => cId.toString() === company._id.toString(),
            ) ||
              u.role === "admin"),
        );

        if (supportUsers.length > 0) {
          assignedTo = faker.helpers.arrayElement(supportUsers)._id;
        }
      }

      const statusWeights = {
        open: 0.4,
        in_progress: 0.3,
        resolved: 0.2,
        closed: 0.1,
      };
      const statusRandom = Math.random();
      let status: "open" | "in_progress" | "resolved" | "closed" = "open";
      if (statusRandom < statusWeights.closed) status = "closed";
      else if (statusRandom < statusWeights.closed + statusWeights.resolved)
        status = "resolved";
      else if (
        statusRandom <
        statusWeights.closed +
          statusWeights.resolved +
          statusWeights.in_progress
      )
        status = "in_progress";

      const { ticketNumber, year } = await getNextTicketNumberForCompany(
        company._id.toString(),
      );

      const ticket = await Ticket.create({
        title: faker.helpers.arrayElement([
          `Bug: ${faker.hacker.phrase()}`,
          `Feature: ${faker.commerce.productName()}`,
          `Support: ${faker.company.catchPhrase()}`,
          `Incident: ${faker.hacker.ingverb()} ${faker.hacker.noun()}`,
        ]),
        description: faker.lorem.paragraphs(2),
        status,
        priority: faker.helpers.arrayElement(priorities),
        type: faker.helpers.arrayElement(types),
        ticketNumber,
        year,
        company: company._id,
        createdBy: createdBy._id,
        assignedTo,
      });

      tickets.push(ticket);
    }

    console.log(`✅ ${tickets.length} tickets créés`);
    console.log(
      `   - Open: ${tickets.filter((t) => t.status === "open").length}`,
    );
    console.log(
      `   - In Progress: ${tickets.filter((t) => t.status === "in_progress").length}`,
    );
    console.log(
      `   - Resolved: ${tickets.filter((t) => t.status === "resolved").length}`,
    );
    console.log(
      `   - Closed: ${tickets.filter((t) => t.status === "closed").length}\n`,
    );

    // ==================== 4. LOGS (optionnel) ====================
    console.log(`📝 Création de quelques logs de test...`);

    const actions = [
      "create",
      "update",
      "delete",
      "login",
      "logout",
      "register",
    ] as const;
    const entities = ["User", "Company", "Ticket"];

    for (let i = 0; i < 50; i++) {
      const randomUser = faker.helpers.arrayElement(
        users.filter((u) => !u.isDeleted),
      );
      const action = faker.helpers.arrayElement(actions);
      const entity = faker.helpers.arrayElement(entities);

      await Log.create({
        userId: randomUser._id,
        action,
        entity,
        entityId: faker.datatype.boolean(0.7)
          ? faker.helpers.arrayElement(tickets)._id
          : undefined,
        success: faker.datatype.boolean(0.9),
        message: `${action} ${entity} ${faker.datatype.boolean(0.9) ? "réussi" : "échoué"}`,
        details: {
          ip: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });
    }

    console.log(`✅ 50 logs créés\n`);

    // ==================== RÉSUMÉ ====================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SEEDING TERMINÉ AVEC SUCCÈS\n");
    console.log("📊 Résumé:");
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Tickets: ${tickets.length}`);
    console.log(`   - Logs: 50\n`);
    console.log("🔐 Identifiants de test:");
    console.log("   Email: admin@ticketing.com");
    console.log("   Password: Password@123\n");
    console.log("   (Tous les users ont le même password)\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  }
};

seed();

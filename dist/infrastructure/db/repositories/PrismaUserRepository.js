"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const User_1 = require("../../../domain/entities/User");
class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const rawUser = await this.prisma.user.findUnique({ where: { id } });
        if (!rawUser)
            return null;
        return this.mapToDomain(rawUser);
    }
    async findByEmail(email) {
        const rawUser = await this.prisma.user.findUnique({ where: { email } });
        if (!rawUser)
            return null;
        return this.mapToDomain(rawUser);
    }
    async findByUsername(username) {
        const rawUser = await this.prisma.user.findUnique({ where: { username } });
        if (!rawUser)
            return null;
        return this.mapToDomain(rawUser);
    }
    async save(user) {
        const rawUser = await this.prisma.user.upsert({
            where: { id: user.id },
            update: {
                username: user.username,
                email: user.email,
                passwordHash: user.passwordHash,
                role: user.role,
            },
            create: {
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.passwordHash,
                role: user.role,
            },
        });
        return this.mapToDomain(rawUser);
    }
    mapToDomain(raw) {
        return new User_1.User({
            id: raw.id,
            username: raw.username,
            email: raw.email,
            passwordHash: raw.passwordHash,
            role: raw.role,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
}
exports.PrismaUserRepository = PrismaUserRepository;

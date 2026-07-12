"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
class InMemoryUserRepository {
    users = new Map();
    async findById(id) {
        return this.users.get(id) || null;
    }
    async findByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email)
                return user;
        }
        return null;
    }
    async findByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username)
                return user;
        }
        return null;
    }
    async save(user) {
        this.users.set(user.id, user);
        return user;
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;

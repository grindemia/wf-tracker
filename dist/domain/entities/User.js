"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get username() { return this.props.username; }
    get email() { return this.props.email; }
    get passwordHash() { return this.props.passwordHash; }
    get role() { return this.props.role; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }
    // Regla de negocio: verificar si es administrador
    isAdmin() {
        return this.props.role === 'ADMIN';
    }
}
exports.User = User;

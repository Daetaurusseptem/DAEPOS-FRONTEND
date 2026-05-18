import { Company, UserRole } from "../interfaces/models.interface";

export class UsuarioModel {

    constructor(
        public id: string,
        public username: string,
        public name: string,
        public role: UserRole,
        public email: string,
        public img?: string,
        public password?: string,
        public company?:Company,
        public permissions?: string[]
    ) {}
  }

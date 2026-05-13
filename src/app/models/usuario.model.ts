import { Company } from "../interfaces/models.interface";

export class UsuarioModel {

    constructor(
        public id: string,
        public username: string,
        public name: string,
        public role: 'user'|'admin'|'sysadmin',
        public email: string,
        public img?: string,
        public password?: string,
        public company?:Company
    ) {}
  }

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private publicUser(u: User) {
    return { id: u.id, email: u.email, fullName: u.fullName, role: u.role };
  }
  private token(u: User) {
    return this.jwt.sign({ sub: u.id, email: u.email, role: u.role });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Email đã được đăng ký');
    const user = await this.prisma.user.create({
      data: { email, fullName: dto.fullName, role: Role.CUSTOMER, passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return { accessToken: this.token(user), user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return { accessToken: this.token(user), user: this.publicUser(user) };
  }

  async me(id: number) {
    return this.publicUser(await this.prisma.user.findUniqueOrThrow({ where: { id } }));
  }
}

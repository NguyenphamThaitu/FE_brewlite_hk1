import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @IsString() @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' }) @MaxLength(72) password: string;
  @IsString() @MinLength(1, { message: 'Vui lòng nhập họ tên' }) @MaxLength(100) fullName: string;
}
export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @IsString() password: string;
}

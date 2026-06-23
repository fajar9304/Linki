import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString({ message: 'Username harus berupa string' })
  @Length(3, 30, { message: 'Username harus berukuran antara 3 sampai 30 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username hanya boleh mengandung huruf, angka, dan underscore' })
  username!: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  @Length(6, 100, { message: 'Password minimal terdiri dari 6 karakter' })
  password!: string;
}

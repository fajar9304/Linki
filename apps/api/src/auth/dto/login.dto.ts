import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email atau username tidak boleh kosong' })
  @IsString({ message: 'Email atau username harus berupa string' })
  identity!: string; // email or username

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString({ message: 'Password harus berupa string' })
  @Length(6, 100, { message: 'Password minimal terdiri dari 6 karakter' })
  password!: string;
}

import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Nama tampilan harus berupa string' })
  @Length(1, 100, { message: 'Nama tampilan maksimal 100 karakter' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Bio harus berupa string' })
  @Length(0, 500, { message: 'Bio maksimal 500 karakter' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'URL Foto Profil harus berupa string' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Warna latar belakang harus berupa string' })
  backgroundColor?: string;

  @IsOptional()
  @IsString({ message: 'Warna kartu harus berupa string' })
  cardColor?: string;

  @IsOptional()
  @IsString({ message: 'Warna aksen utama harus berupa string' })
  primaryColor?: string;

  @IsOptional()
  @IsString({ message: 'Warna aksen sekunder harus berupa string' })
  primaryLightColor?: string;
}

import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class AuthLoginDto {
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(9, 20, {
    /**
     * $value: 当前值
     * $property: 当前属性名
     * $target: 当前类名
     * $constraint1: 最小长度
     * $constraint2: 最大长度
     */
    message: '密码长度必须在$constraint1和$constraint2之间，当前长度为$value',
  })
  @Type(() => String)
  password: string;
}

export class AuthRegisterDto extends AuthLoginDto {
  @IsString()
  nickname: string;

  @IsPhoneNumber('CN')
  phoneNumber: string;

  @IsEmail()
  email: string;
}
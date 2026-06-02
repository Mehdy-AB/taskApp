import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '../../../generated/prisma/client.js';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  departmentId: number;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

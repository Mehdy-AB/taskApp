import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '../../../generated/prisma/client.js';

export type SortableField = 'fullName' | 'email' | 'jobTitle' | 'status' | 'department' | 'createdBy' | 'createdAt';

export class ListEmployeesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsIn(['fullName', 'email', 'jobTitle', 'status', 'department', 'createdBy', 'createdAt'])
  sortBy?: SortableField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

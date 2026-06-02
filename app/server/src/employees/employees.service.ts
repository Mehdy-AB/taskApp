import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityAction } from '../../generated/prisma/client.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { ListEmployeesDto, SortableField } from './dto/list-employees.dto.js';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, name: true } },
  createdBy:  { select: { id: true, email: true } },
} as const;

function mapEmployee(emp: any) {
  return {
    id:           emp.id,
    fullName:     emp.fullName,
    email:        emp.email,
    department:   emp.department.name,
    departmentId: emp.department.id,
    jobTitle:     emp.jobTitle,
    status:       emp.status,
    createdBy:    emp.createdBy.email,
    createdAt:    emp.createdAt.toISOString(),
    updatedAt:    emp.updatedAt.toISOString(),
  };
}

function buildOrderBy(sortBy?: SortableField, sortDir: 'asc' | 'desc' = 'asc') {
  const dir = sortDir;
  switch (sortBy) {
    case 'department': return { department: { name: dir } };
    case 'createdBy':  return { createdBy:  { email: dir } };
    default:           return { [sortBy ?? 'createdAt']: dir };
  }
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [total, active, inactive, departments] = await this.prisma.$transaction([
      this.prisma.employee.count({ where: { isDeleted: false } }),
      this.prisma.employee.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { isDeleted: false, status: 'INACTIVE' } }),
      this.prisma.department.count(),
    ]);
    return { total, active, inactive, departments };
  }

  async findAll(query: ListEmployeesDto) {
    const { search, department, status, sortBy, sortDir, page = 1, pageSize = 10 } = query;

    const where = {
      isDeleted: false,
      ...(status     && { status }),
      ...(department && { department: { name: department } }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email:    { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include:  EMPLOYEE_INCLUDE,
        orderBy:  buildOrderBy(sortBy, sortDir),
        skip:     (page - 1) * pageSize,
        take:     pageSize,
      }),
    ]);

    return {
      data:       employees.map(mapEmployee),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const emp = await this.prisma.employee.findFirst({
      where:   { id, isDeleted: false },
      include: EMPLOYEE_INCLUDE,
    });
    if (!emp) throw new NotFoundException(`Employee #${id} not found`);
    return mapEmployee(emp);
  }

  async create(dto: CreateEmployeeDto, actorId: number) {
    await this.ensureDepartmentExists(dto.departmentId);
    await this.ensureEmailUnique(dto.email);

    const emp = await this.prisma.employee.create({
      data: {
        fullName:     dto.fullName,
        email:        dto.email,
        departmentId: dto.departmentId,
        jobTitle:     dto.jobTitle,
        status:       dto.status ?? 'ACTIVE',
        createdById:  actorId,
        updatedById:  actorId,
      },
      include: EMPLOYEE_INCLUDE,
    });

    await this.log(actorId, emp.id, ActivityAction.CREATE, { fullName: emp.fullName, email: emp.email });

    return mapEmployee(emp);
  }

  async update(id: number, dto: UpdateEmployeeDto, actorId: number) {
    const existing = await this.prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException(`Employee #${id} not found`);

    if (dto.departmentId) await this.ensureDepartmentExists(dto.departmentId);
    if (dto.email && dto.email !== existing.email) await this.ensureEmailUnique(dto.email);

    const emp = await this.prisma.employee.update({
      where:   { id },
      data:    { ...dto, updatedById: actorId },
      include: EMPLOYEE_INCLUDE,
    });

    await this.log(actorId, emp.id, ActivityAction.UPDATE, dto);

    return mapEmployee(emp);
  }

  async remove(id: number, actorId: number) {
    const existing = await this.prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException(`Employee #${id} not found`);

    await this.prisma.employee.update({
      where: { id },
      data:  { isDeleted: true, deletedAt: new Date(), updatedById: actorId },
    });

    await this.log(actorId, id, ActivityAction.DELETE, { fullName: existing.fullName });
  }

  private async ensureDepartmentExists(departmentId: number) {
    const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new BadRequestException(`Department #${departmentId} does not exist`);
  }

  private async ensureEmailUnique(email: string) {
    const existing = await this.prisma.employee.findFirst({ where: { email, isDeleted: false } });
    if (existing) throw new ConflictException(`Email ${email} is already in use`);
  }

  private log(userId: number, employeeId: number, action: ActivityAction, payload: object) {
    return this.prisma.activityLog.create({
      data: { userId, employeeId, action, payload },
    });
  }
}

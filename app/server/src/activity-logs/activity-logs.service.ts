import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListActivityLogsDto } from './dto/list-activity-logs.dto.js';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListActivityLogsDto) {
    const { page = 1, pageSize = 10, action } = query;

    const where = action ? { action } : {};

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        include: {
          user:     { select: { id: true, email: true } },
          employee: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
    ]);

    return {
      data: logs.map(log => ({
        id:        log.id,
        action:    log.action,
        employee:  log.employee ? { id: log.employee.id, fullName: log.employee.fullName } : null,
        user:      { id: log.user.id, email: log.user.email },
        payload:   log.payload,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

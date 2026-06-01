import { PrismaClient } from '../generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Design'];

const EMPLOYEES = [
  { fullName: 'Alice Johnson',   email: 'alice.j@company.com',   dept: 'Engineering', jobTitle: 'Senior Developer',    status: 'ACTIVE'   },
  { fullName: 'Bob Smith',       email: 'bob.s@company.com',     dept: 'Marketing',   jobTitle: 'Marketing Manager',   status: 'ACTIVE'   },
  { fullName: 'Carol White',     email: 'carol.w@company.com',   dept: 'HR',          jobTitle: 'HR Specialist',       status: 'INACTIVE' },
  { fullName: 'David Brown',     email: 'david.b@company.com',   dept: 'Engineering', jobTitle: 'Frontend Developer',  status: 'ACTIVE'   },
  { fullName: 'Emma Davis',      email: 'emma.d@company.com',    dept: 'Design',      jobTitle: 'UI/UX Designer',      status: 'ACTIVE'   },
  { fullName: 'Frank Miller',    email: 'frank.m@company.com',   dept: 'Finance',     jobTitle: 'Financial Analyst',   status: 'INACTIVE' },
  { fullName: 'Grace Wilson',    email: 'grace.w@company.com',   dept: 'Engineering', jobTitle: 'Backend Developer',   status: 'ACTIVE'   },
  { fullName: 'Henry Taylor',    email: 'henry.t@company.com',   dept: 'Marketing',   jobTitle: 'Content Strategist',  status: 'ACTIVE'   },
  { fullName: 'Isla Martinez',   email: 'isla.m@company.com',    dept: 'Finance',     jobTitle: 'Accountant',          status: 'ACTIVE'   },
  { fullName: 'James Anderson',  email: 'james.a@company.com',   dept: 'HR',          jobTitle: 'Talent Acquisition',  status: 'ACTIVE'   },
  { fullName: 'Karen Thomas',    email: 'karen.t@company.com',   dept: 'Design',      jobTitle: 'Graphic Designer',    status: 'INACTIVE' },
  { fullName: 'Liam Jackson',    email: 'liam.j@company.com',    dept: 'Engineering', jobTitle: 'DevOps Engineer',     status: 'ACTIVE'   },
  { fullName: 'Mia Robinson',    email: 'mia.r@company.com',     dept: 'Marketing',   jobTitle: 'SEO Specialist',      status: 'ACTIVE'   },
  { fullName: 'Noah Lee',        email: 'noah.l@company.com',    dept: 'Engineering', jobTitle: 'QA Engineer',         status: 'ACTIVE'   },
  { fullName: 'Olivia Harris',   email: 'olivia.h@company.com',  dept: 'Finance',     jobTitle: 'Budget Analyst',      status: 'ACTIVE'   },
  { fullName: 'Paul Clark',      email: 'paul.c@company.com',    dept: 'HR',          jobTitle: 'Payroll Manager',     status: 'ACTIVE'   },
  { fullName: 'Quinn Lewis',     email: 'quinn.l@company.com',   dept: 'Design',      jobTitle: 'Product Designer',    status: 'ACTIVE'   },
  { fullName: 'Rachel Walker',   email: 'rachel.w@company.com',  dept: 'Engineering', jobTitle: 'Data Engineer',       status: 'INACTIVE' },
  { fullName: 'Sam Young',       email: 'sam.y@company.com',     dept: 'Marketing',   jobTitle: 'Brand Manager',       status: 'ACTIVE'   },
  { fullName: 'Tina Hall',       email: 'tina.h@company.com',    dept: 'Finance',     jobTitle: 'Tax Specialist',      status: 'ACTIVE'   },
] as const;

async function main() {
  console.log('Seeding database...');

  // Upsert departments
  const deptMap: Record<string, number> = {};
  for (const name of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    deptMap[name] = dept.id;
  }

  // Upsert admin user
  const adminHash = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { email: 'admin@company.com', passwordHash: adminHash, role: 'ADMIN' },
  });

  // Upsert employees
  for (const emp of EMPLOYEES) {
    await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        fullName: emp.fullName,
        email: emp.email,
        departmentId: deptMap[emp.dept],
        jobTitle: emp.jobTitle,
        status: emp.status as 'ACTIVE' | 'INACTIVE',
        createdById: admin.id,
      },
    });
  }

  console.log(`Done — ${DEPARTMENTS.length} depts, ${EMPLOYEES.length} employees, 1 admin (admin@company.com / password)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

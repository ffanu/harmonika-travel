import {PrismaClient} from "@prisma/client";
const shared=globalThis as unknown as {prisma?:PrismaClient};
export const db=shared.prisma??new PrismaClient();
if(process.env.NODE_ENV!=="production")shared.prisma=db;
